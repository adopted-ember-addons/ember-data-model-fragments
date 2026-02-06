import { isEmpty } from '@ember/utils';
import { module, test } from 'qunit';
import { setupApplicationTest } from '../helpers';
import JSONSerializer from '@ember-data/serializer/json';
import FragmentSerializer from 'ember-data-model-fragments/serializer';
import Person from 'dummy/models/person';
import { fragmentArray, array } from 'ember-data-model-fragments/attributes';
import Pretender from 'pretender';
// eslint-disable-next-line ember/use-ember-data-rfc-395-imports
import DS from 'ember-data';
let store, owner;

module('unit - Serialization', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function () {
    owner = this.owner;
    store = owner.lookup('service:store');

    // TODO: this is necessary to set `typeKey` and prevent `store#serializerFor` from blowing up
    store.modelFor('person');
  });

  hooks.afterEach(function () {
    owner = null;
    store = null;
  });

  test('polymorphic properties are deserialized correctly', async function (assert) {
    store.pushPayload('component', {
      data: [
        {
          type: 'components',
          id: 1,
          attributes: {
            type: 'text',
            options: {
              fontFamily: 'roman',
              fontSize: 12,
            },
          },
        },
      ],
    });

    const component = store.peekRecord('component', 1);
    assert.strictEqual(component.options.fontSize, 12);
    assert.strictEqual(component.options.fontFamily, 'roman');
  });

  test('fragment properties are snapshotted as normal attributes on the owner record snapshot', async function (assert) {
    assert.expect(7);
    // Store expected values before pushing - store.push may mutate the source object
    const expectedName = { first: 'Catelyn', last: 'Stark' };
    const expectedHouses = [
      { name: 'Tully', region: 'Riverlands', exiled: true },
      { name: 'Stark', region: 'North', exiled: true },
    ];
    const expectedChildren = ['Robb', 'Sansa', 'Arya', 'Brandon', 'Rickon'];

    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          name: { first: 'Catelyn', last: 'Stark' },
          houses: [
            { name: 'Tully', region: 'Riverlands', exiled: true },
            { name: 'Stark', region: 'North', exiled: true },
          ],
          children: ['Robb', 'Sansa', 'Arya', 'Brandon', 'Rickon'],
        },
      },
    });

    class PersonSerializer extends JSONSerializer {
      serialize(snapshot) {
        const name = snapshot.attr('name');
        assert.ok(
          name instanceof DS.Snapshot,
          'fragment snapshot attribute is a snapshot',
        );

        assert.equal(
          name.attr('first'),
          expectedName.first,
          'fragment attributes are snapshoted correctly',
        );

        const houses = snapshot.attr('houses');
        assert.ok(
          Array.isArray(houses),
          'fragment array attribute is an array',
        );
        assert.ok(
          houses[0] instanceof DS.Snapshot,
          'fragment array attribute is an array of snapshots',
        );
        assert.equal(
          houses[0].attr('name'),
          expectedHouses[0].name,
          'fragment array attributes are snapshotted correctly',
        );

        const children = snapshot.attr('children');
        assert.ok(Array.isArray(children), 'array attribute is an array');
        assert.deepEqual(
          children,
          expectedChildren,
          'array attribute is snapshotted correctly',
        );
      }
    }
    owner.register('serializer:person', PersonSerializer);

    const person2 = await store.findRecord('person', 1);
    person2.serialize();
  });

  test('fragment properties are serialized as normal attributes using their own serializers', async function (assert) {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          name: {
            first: 'Aerys',
            last: 'Targaryen',
          },
        },
      },
    });

    class NameSerializer extends JSONSerializer {
      serialize() {
        return 'Mad King';
      }
    }
    owner.register('serializer:name', NameSerializer);

    const person = await store.findRecord('person', 1);
    const serialized = person.serialize();

    assert.equal(
      serialized.name,
      'Mad King',
      'serialization uses result from `fragment#serialize`',
    );
  });

  test('serializing a fragment array creates a new array with contents the result of serializing each fragment', async function (assert) {
    const names = [
      {
        first: 'Rhaegar',
        last: 'Targaryen',
        prefixes: [],
      },
      {
        first: 'Viserys',
        last: 'Targaryen',
        prefixes: [],
      },
      {
        first: 'Daenerys',
        last: 'Targaryen',
        prefixes: [],
      },
    ];

    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          names: names,
        },
      },
    });

    // Use FragmentSerializer to ensure proper fragment transform handling
    owner.register('serializer:name', FragmentSerializer);

    const person = await store.findRecord('person', 1);
    const serialized = person.serialize();

    assert.deepEqual(
      serialized.names,
      names,
      'serializing returns array of each fragment serialized',
    );
  });

  test('normalizing data can handle `null` fragment values', function (assert) {
    class NullDefaultPerson extends Person {
      @fragmentArray('house', { defaultValue: null }) houses;
      @array({ defaultValue: null }) children;
    }

    owner.register('model:nullDefaultPerson', NullDefaultPerson);

    const normalized = store.normalize('nullDefaultPerson', {
      name: null,
      houses: null,
      children: null,
    });

    const attributes = normalized.data.attributes;

    assert.strictEqual(
      attributes.name,
      null,
      'fragment property values can be null',
    );
    assert.strictEqual(
      attributes.houses,
      null,
      'fragment array property values can be null',
    );
    assert.strictEqual(
      attributes.children,
      null,
      '`array property values can be null',
    );
  });

  test('normalizing data can handle `null` fragment values', async function (assert) {
    class NullDefaultPerson extends Person {
      @fragmentArray('house', { defaultValue: null }) houses;
      @array({ defaultValue: null }) children;
    }

    owner.register('model:nullDefaultPerson', NullDefaultPerson);

    store.push({
      data: {
        type: 'NullDefaultPerson',
        id: 1,
        attributes: {
          name: null,
          houses: null,
          children: null,
        },
      },
    });

    const person = await store.findRecord('nullDefaultPerson', 1);
    const serialized = person.serialize();

    assert.strictEqual(
      serialized.name,
      null,
      'fragment property values can be null',
    );
    assert.strictEqual(
      serialized.houses,
      null,
      'fragment array property values can be null',
    );
    assert.strictEqual(
      serialized.children,
      null,
      '`array property values can be null',
    );
  });

  test('array properties use the specified transform to normalize data', function (assert) {
    const values = [1, 0, true, false, 'true', ''];

    const normalized = store.normalize('person', {
      strings: values,
      numbers: values,
      booleans: values,
    });

    const attributes = normalized.data.attributes;

    // String transform converts falsy values (except '') to null
    const expectedStrings = values.map((v) =>
      !v && v !== '' ? null : String(v),
    );
    // Number transform: isEmpty or NaN -> null, otherwise Number
    const expectedNumbers = values.map((v) =>
      isEmpty(v) || isNaN(Number(v)) ? null : Number(v),
    );
    // Boolean transform: just Boolean(v)
    const expectedBooleans = values.map((v) => Boolean(v));

    assert.deepEqual(
      attributes.strings,
      expectedStrings,
      'string values are normalized',
    );
    assert.deepEqual(
      attributes.numbers,
      expectedNumbers,
      'number values are normalized',
    );
    assert.deepEqual(
      attributes.booleans,
      expectedBooleans,
      'boolean values are normalized',
    );
  });

  test('array properties use the specified transform to serialize data', async function (assert) {
    const values = [1, 0, true, false, 'true', ''];

    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          strings: values,
          numbers: values,
          booleans: values,
        },
      },
    });

    const person = await store.findRecord('person', 1);
    const serialized = person.serialize();

    // String transform converts falsy values (except '') to null
    const expectedStrings = values.map((v) =>
      !v && v !== '' ? null : String(v),
    );
    // Number transform: isEmpty or NaN -> null, otherwise Number
    const expectedNumbers = values.map((v) =>
      isEmpty(v) || isNaN(Number(v)) ? null : Number(v),
    );
    // Boolean transform: just Boolean(v)
    const expectedBooleans = values.map((v) => Boolean(v));

    assert.deepEqual(
      serialized.strings,
      expectedStrings,
      'string values are serialized',
    );
    assert.deepEqual(
      serialized.numbers,
      expectedNumbers,
      'number values are serialized',
    );
    assert.deepEqual(
      serialized.booleans,
      expectedBooleans,
      'boolean values are serialized',
    );
  });

  module('when saving the record', function (saveHooks) {
    let server;

    saveHooks.beforeEach(function () {
      server = new Pretender();
    });

    saveHooks.afterEach(function () {
      server.shutdown();
    });

    test('changedAttributes should have the same result when serialized as before the save is called', async function (assert) {
      assert.expect(3);

      store.pushPayload('component', {
        data: {
          type: 'components',
          id: 1,
          attributes: {
            name: 'mine',
            type: 'text',
            options: {
              fontFamily: 'roman',
              fontSize: 12,
            },
          },
        },
      });
      const component = store.peekRecord('component', 1);

      component.options.fontFamily = 'sans-serif';

      assert.deepEqual(component.changedAttributes(), {
        options: [
          {
            fontFamily: 'roman',
            fontSize: 12,
          },
          {
            fontFamily: 'sans-serif',
            fontSize: 12,
          },
        ],
      });

      server.put('/components/1', (request) => {
        assert.deepEqual(JSON.parse(request.requestBody), {
          data: {
            type: 'components',
            attributes: {
              options: {
                fontFamily: 'sans-serif',
                fontSize: 12,
              },
            },
          },
        });
        return [204, { 'Content-Type': 'application/json' }, '{}'];
      });

      await component.save();

      assert.deepEqual(component.changedAttributes(), {});
    });
  });
});
