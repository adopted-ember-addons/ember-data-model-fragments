import { isEmpty } from '@ember/utils';
import { run } from '@ember/runloop';
import { module, test } from 'qunit';
import { setupApplicationTest } from 'ember-qunit';
import JSONSerializer from 'ember-data/serializers/json';
import Person from 'dummy/models/person';
import MF from 'ember-data-model-fragments';
import DS from 'ember-data';
let store, owner;

module('unit - Serialization', function(hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function(assert) {
    owner = this.owner;
    store = owner.lookup('service:store');

    assert.expectNoDeprecation();

    // TODO: this is necessary to set `typeKey` and prevent `store#serializerFor` from blowing up
    store.modelFor('person');
  });

  hooks.afterEach(function() {
    owner = null;
    store = null;
  });

  test('fragment properties are snapshotted as normal attributes on the owner record snapshot', function(assert) {
    let person = {
      name: {
        first: 'Catelyn',
        last: 'Stark'
      },
      houses: [
        {
          name: 'Tully',
          region: 'Riverlands',
          exiled: true
        },
        {
          name: 'Stark',
          region: 'North',
          exiled: true
        }
      ],
      children: [
        'Robb',
        'Sansa',
        'Arya',
        'Brandon',
        'Rickon'
      ]
    };

    run(() => {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: person
        }
      });

      owner.register('serializer:person', JSONSerializer.extend({
        serialize(snapshot) {
          let name = snapshot.attr('name');
          assert.ok(name instanceof DS.Snapshot, 'fragment snapshot attribute is a snapshot');

          assert.equal(name.attr('first'), person.name.first, 'fragment attributes are snapshoted correctly');

          let houses = snapshot.attr('houses');
          assert.ok(Array.isArray(houses), 'fragment array attribute is an array');
          assert.ok(houses[0] instanceof DS.Snapshot, 'fragment array attribute is an array of snapshots');
          assert.equal(houses[0].attr('name'), person.houses[0].name, 'fragment array attributes are snapshotted correctly');

          let children = snapshot.attr('children');
          assert.ok(Array.isArray(children), 'array attribute is an array');
          assert.deepEqual(children, person.children, 'array attribute is snapshotted correctly');
        }
      }));

      return store.find('person', 1).then(person => {
        person.serialize();
      });
    });
  });

  test('fragment properties are serialized as normal attributes using their own serializers', function(assert) {
    run(() => {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            name: {
              first: 'Aerys',
              last: 'Targaryen'
            }
          }
        }
      });

      owner.register('serializer:name', JSONSerializer.extend({
        serialize() {
          return 'Mad King';
        }
      }));

      return store.find('person', 1).then(person => {
        let serialized = person.serialize();

        assert.equal(serialized.name, 'Mad King', 'serialization uses result from `fragment#serialize`');
      });
    });
  });

  test('serializing a fragment array creates a new array with contents the result of serializing each fragment', function(assert) {
    let names = [
      {
        first: 'Rhaegar',
        last: 'Targaryen'
      },
      {
        first: 'Viserys',
        last: 'Targaryen'
      },
      {
        first: 'Daenerys',
        last: 'Targaryen'
      }
    ];

    run(() => {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            names: names
          }
        }
      });

      owner.register('serializer:name', JSONSerializer);

      return store.find('person', 1).then(person => {
        let serialized = person.serialize();

        assert.deepEqual(serialized.names, names, 'serializing returns array of each fragment serialized');
      });
    });
  });

  test('normalizing data can handle `null` fragment values', function(assert) {
    let NullDefaultPerson = Person.extend({
      houses: MF.fragmentArray('house', { defaultValue: null }),
      children: MF.array({ defaultValue: null })
    });

    owner.register('model:nullDefaultPerson', NullDefaultPerson);

    let normalized = store.normalize('nullDefaultPerson', {
      name: null,
      houses: null,
      children: null
    });

    let attributes = normalized.data.attributes;

    assert.strictEqual(attributes.name, null, 'fragment property values can be null');
    assert.strictEqual(attributes.houses, null, 'fragment array property values can be null');
    assert.strictEqual(attributes.children, null, '`array property values can be null');
  });

  test('normalizing data can handle `null` fragment values', function(assert) {
    let NullDefaultPerson = Person.extend({
      houses: MF.fragmentArray('house', { defaultValue: null }),
      children: MF.array({ defaultValue: null })
    });

    owner.register('model:nullDefaultPerson', NullDefaultPerson);

    run(() => {
      store.push({
        data: {
          type: 'NullDefaultPerson',
          id: 1,
          attributes: {
            name: null,
            houses: null,
            children: null
          }
        }
      });

      return store.find('nullDefaultPerson', 1).then(person => {
        let serialized = person.serialize();

        assert.strictEqual(serialized.name, null, 'fragment property values can be null');
        assert.strictEqual(serialized.houses, null, 'fragment array property values can be null');
        assert.strictEqual(serialized.children, null, '`array property values can be null');
      });
    });
  });

  test('array properties use the specified transform to normalize data', function(assert) {
    let values = [1, 0, true, false, 'true', ''];

    let normalized = store.normalize('person', {
      strings: values,
      numbers: values,
      booleans: values
    });

    let attributes = normalized.data.attributes;

    assert.ok(values.every((value, index) => {
      return attributes.strings[index] === String(value) &&
        attributes.numbers[index] === (isEmpty(value) || isNaN(Number(value)) ? null : Number(value)) &&
        attributes.booleans[index] === Boolean(value);
    }), 'fragment property values are normalized');
  });

  test('array properties use the specified transform to serialize data', function(assert) {
    let values = [1, 0, true, false, 'true', ''];

    run(() => {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            strings: values,
            numbers: values,
            booleans: values
          }
        }
      });

      return store.find('person', 1).then(person => {
        let serialized = person.serialize();

        assert.ok(values.every((value, index) => {
          return serialized.strings[index] === String(value) &&
            serialized.numbers[index] === (isEmpty(value) || isNaN(Number(value)) ? null : Number(value)) &&
            serialized.booleans[index] === Boolean(value);
        }), 'fragment property values are normalized');
      });
    });
  });
});
