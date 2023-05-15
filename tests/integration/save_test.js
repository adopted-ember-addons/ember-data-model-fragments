/* eslint-disable ember/no-observers */
import Model, { attr } from '@ember-data/model';
import {
  fragment,
  fragmentArray,
  array,
} from 'ember-data-model-fragments/attributes';
import EmberObject, { observer } from '@ember/object';
import { addObserver } from '@ember/object/observers';
import ObjectProxy from '@ember/object/proxy';
import { copy } from 'ember-copy';
import MF from 'ember-data-model-fragments';
import { module, test, skip } from 'qunit';
import { setupApplicationTest } from '../helpers';
import Pretender from 'pretender';
let store, owner, server;

module('integration - Persistence', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function () {
    owner = this.owner;
    store = owner.lookup('service:store');
    server = new Pretender();
  });

  hooks.afterEach(function () {
    store = null;
    owner = null;
    server.shutdown();
  });

  test('persisting the owner record changes the fragment state to non-new', async function (assert) {
    let data = {
      name: {
        first: 'Viserys',
        last: 'Targaryen',
      },
    };

    let person = store.createRecord('person');

    person.set('name', store.createFragment('name', data.name));

    let payload = {
      person: copy(data, true),
    };
    payload.person.id = 3;

    server.post('/people', () => {
      return [
        200,
        { 'Content-Type': 'application/json' },
        JSON.stringify(payload),
      ];
    });

    await person.save();
    assert.ok(!person.get('name.isNew'), 'fragments are not new after save');
  });

  test('persisting the owner record in a clean state maintains clean state', async function (assert) {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          name: {
            first: 'Tyrion',
            last: 'Lannister',
          },
          addresses: [
            {
              street: '1 Sky Cell',
              city: 'Eyre',
              region: 'Vale of Arryn',
              country: 'Westeros',
            },
          ],
        },
      },
    });

    server.put('/people/1', () => {
      return [200, { 'Content-Type': 'application/json' }, '{}'];
    });

    const person = await store.find('person', 1);
    await person.save();

    let name = person.get('name');
    let addresses = person.get('addresses');

    assert.ok(!name.get('hasDirtyAttributes'), 'fragment is clean');
    assert.ok(
      !addresses.isAny('hasDirtyAttributes'),
      'all fragment array fragments are clean'
    );
    assert.ok(!addresses.get('hasDirtyAttributes'), 'fragment array is clean');
    assert.ok(!person.get('hasDirtyAttributes'), 'owner record is clean');
  });

  test('overwrite current state with fragment attributes from the save response', async function (assert) {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          title: 'Lord',
          name: {
            first: 'Tyrion',
            last: 'Lannister',
          },
        },
      },
    });

    server.put('/people/1', (request) => {
      const body = JSON.parse(request.requestBody);
      assert.equal(body.person.title, 'modified');
      assert.equal(body.person.name.first, 'modified');
      assert.equal(body.person.name.last, 'modified');
      body.person.title = 'Ser';
      body.person.name.first = 'Tywin';
      body.person.name.last = 'Lannister';
      return [
        200,
        { 'Content-Type': 'application/json' },
        JSON.stringify(body),
      ];
    });

    const person = await store.find('person', 1);

    person.set('title', 'modified');
    person.set('name.first', 'modified');
    person.set('name.last', 'modified');
    await person.save();

    assert.equal(
      person.get('title'),
      'Ser',
      'use person.title from the response'
    );
    assert.ok(!person.get('hasDirtyAttributes'), 'owner record is clean');

    const name = person.get('name');
    assert.equal(
      name.get('first'),
      'Tywin',
      'use person.name.first from the response'
    );
    assert.equal(
      name.get('last'),
      'Lannister',
      'use person.name.last from the response'
    );
    assert.ok(!name.get('hasDirtyAttributes'), 'fragment is clean');
  });

  test('when setting a property to the same value', async function (assert) {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          title: 'Lord',
          name: {
            first: 'Tyrion',
            last: 'Lannister',
          },
        },
      },
    });

    server.put('/people/1', () => {
      return [204];
    });

    const person = await store.find('person', 1);

    person.set('title', 'titleModified');
    person.set('name.first', 'firstNameModified');
    person.set('name.last', 'lastNameModified');
    await person.save();

    assert.equal(person.get('title'), 'titleModified');
    assert.ok(!person.get('hasDirtyAttributes'), 'owner record is clean');

    const name = person.get('name');
    assert.equal(name.get('first'), 'firstNameModified');
    assert.equal(name.get('last'), 'lastNameModified');
    assert.ok(!name.get('hasDirtyAttributes'), 'fragment is clean');

    person.set('title', 'titleModified');
    person.set('name.first', 'firstNameModified');
    person.set('name.last', 'lastNameModified');

    assert.ok(!person.get('hasDirtyAttributes'), 'owner record is clean');
    assert.ok(!name.get('hasDirtyAttributes'), 'fragment is clean');
  });

  test('persisting the owner record when a fragment is dirty moves owner record, fragment array, and all fragments into clean state', async function (assert) {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          name: {
            first: 'Eddard',
            last: 'Stark',
          },
          addresses: [
            {
              street: '1 Great Keep',
              city: 'Winterfell',
              region: 'North',
              country: 'Westeros',
            },
          ],
        },
      },
    });

    server.put('/people/1', () => {
      return [200, { 'Content-Type': 'application/json' }, '{}'];
    });

    const person = await store.find('person', 1);

    const name = person.get('name');
    const addresses = person.get('addresses');
    const address = addresses.get('firstObject');

    name.set('first', 'Arya');
    address.set('street', '1 Godswood');

    await person.save();

    assert.equal(name.get('first'), 'Arya', 'change is persisted');
    assert.equal(
      address.get('street'),
      '1 Godswood',
      'fragment array change is persisted'
    );
    assert.ok(!name.get('hasDirtyAttributes'), 'fragment is clean');
    assert.ok(
      !addresses.isAny('hasDirtyAttributes'),
      'all fragment array fragments are clean'
    );
    assert.ok(!addresses.get('hasDirtyAttributes'), 'fragment array is clean');
    assert.ok(!person.get('hasDirtyAttributes'), 'owner record is clean');
  });

  test('persisting a new owner record moves the owner record, fragment array, and all fragments into clean state', async function (assert) {
    let data = {
      name: {
        first: 'Daenerys',
        last: 'Targaryen',
      },
      addresses: [
        store.createFragment('address', {
          street: '1 Stone Drum',
          city: 'Dragonstone',
          region: 'Crownlands',
          country: 'Westeros',
        }),
      ],
    };

    let person = store.createRecord('person');
    person.set('name', store.createFragment('name', data.name));
    person.set('addresses', data.addresses);

    let payload = {
      person: copy(data, true),
    };
    payload.person.id = 3;

    server.post('/people', () => {
      return [
        200,
        { 'Content-Type': 'application/json' },
        JSON.stringify(payload),
      ];
    });

    await person.save();
    let name = person.get('name');
    let addresses = person.get('addresses');

    assert.ok(!name.get('hasDirtyAttributes'), 'fragment is clean');
    assert.ok(
      !addresses.isAny('hasDirtyAttributes'),
      'all fragment array fragments are clean'
    );
    assert.ok(!addresses.get('hasDirtyAttributes'), 'fragment array is clean');
    assert.ok(!person.get('hasDirtyAttributes'), 'owner record is clean');
  });

  test('a new record can be persisted with null fragments', async function (assert) {
    let person = store.createRecord('person');

    assert.equal(person.get('name'), null, 'fragment property is null');
    assert.equal(
      person.get('hobbies'),
      null,
      'fragment array property is null'
    );

    let payload = {
      person: {
        id: 1,
      },
    };

    server.post('/people', () => {
      return [
        200,
        { 'Content-Type': 'application/json' },
        JSON.stringify(payload),
      ];
    });

    await person.save();
    assert.equal(person.get('name'), null, 'fragment property is still null');
    assert.equal(
      person.get('hobbies'),
      null,
      'fragment array property is still null'
    );
    assert.ok(!person.get('hasDirtyAttributes'), 'owner record is clean');
  });

  test('the adapter can update fragments on save', async function (assert) {
    let data = {
      name: {
        first: 'Eddard',
        last: 'Stark',
      },
      addresses: [
        {
          street: '1 Great Keep',
          city: 'Winterfell',
          region: 'North',
          country: 'Westeros',
        },
      ],
    };

    let person = store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: data,
      },
    });

    let payload = {
      person: copy(data, true),
    };
    payload.person.id = 1;
    payload.person.name.first = 'Ned';
    payload.person.addresses[0].street = '1 Godswood';

    server.put('/people/1', () => {
      return [
        200,
        { 'Content-Type': 'application/json' },
        JSON.stringify(payload),
      ];
    });

    await person.save();
    let name = person.get('name');
    let addresses = person.get('addresses');

    assert.ok(!name.get('hasDirtyAttributes'), 'fragment is clean');
    assert.ok(
      !addresses.isAny('hasDirtyAttributes'),
      'all fragment array fragments are clean'
    );
    assert.ok(!addresses.get('hasDirtyAttributes'), 'fragment array is clean');
    assert.ok(!person.get('hasDirtyAttributes'), 'owner record is clean');
    assert.equal(name.get('first'), 'Ned', 'fragment correctly updated');
    assert.equal(
      addresses.get('firstObject.street'),
      '1 Godswood',
      'fragment array fragment correctly updated'
    );
  });

  test('the adapter can set fragments to null on save', async function (assert) {
    let data = {
      name: {
        first: 'Eddard',
        last: 'Stark',
      },
      addresses: [
        {
          street: '1 Great Keep',
          city: 'Winterfell',
          region: 'North',
          country: 'Westeros',
        },
      ],
    };

    let person = store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: data,
      },
    });

    let payload = {
      person: {
        name: null,
        addresses: null,
      },
    };

    server.put('/people/1', () => {
      return [
        200,
        { 'Content-Type': 'application/json' },
        JSON.stringify(payload),
      ];
    });

    assert.equal(person.get('name.first'), 'Eddard', 'fragment initial state');
    assert.equal(
      person.get('addresses.firstObject.country'),
      'Westeros',
      'fragment array initial state'
    );

    await person.save();

    assert.equal(person.get('name'), null, 'fragment correctly updated');
    assert.equal(
      person.get('addresses'),
      null,
      'fragment array correctly updated'
    );
    assert.ok(!person.get('hasDirtyAttributes'), 'owner record is clean');
  });

  test('the adapter can set fragments from null to a new value on save', async function (assert) {
    let person = store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          name: null,
          addresses: null,
        },
      },
    });

    let payload = {
      person: {
        id: 1,
        name: {
          first: 'Eddard',
          last: 'Stark',
        },
        addresses: [
          {
            street: '1 Great Keep',
            city: 'Winterfell',
            region: 'North',
            country: 'Westeros',
          },
        ],
      },
    };

    server.put('/people/1', () => {
      return [
        200,
        { 'Content-Type': 'application/json' },
        JSON.stringify(payload),
      ];
    });

    assert.equal(person.get('name'), null, 'fragment initial state');
    assert.equal(person.get('addresses'), null, 'fragment array initial state');

    await person.save();

    assert.equal(
      person.get('name.first'),
      'Eddard',
      'fragment correctly updated'
    );
    assert.equal(
      person.get('addresses.firstObject.country'),
      'Westeros',
      'fragment array correctly updated'
    );
    assert.ok(!person.get('hasDirtyAttributes'), 'owner record is clean');
  });

  test('existing fragments are updated on save', async function (assert) {
    let data = {
      name: {
        first: 'Eddard',
        last: 'Stark',
      },
      addresses: [
        {
          street: '1 Great Keep',
          city: 'Winterfell',
          region: 'North',
          country: 'Westeros',
        },
      ],
    };

    let payload = {
      person: copy(data, true),
    };

    payload.person.id = 1;
    payload.person.name.first = 'Ned';
    payload.person.addresses[0].street = '1 Godswood';
    payload.person.addresses.unshift({
      street: '1 Red Keep',
      city: 'Kings Landing',
      region: 'Crownlands',
      country: 'Westeros',
    });

    server.post('/people', () => {
      return [
        200,
        { 'Content-Type': 'application/json' },
        JSON.stringify(payload),
      ];
    });

    let person = store.createRecord('person');
    let name = store.createFragment('name', copy(data.name));
    let address = store.createFragment('address', copy(data.addresses[0]));

    person.set('name', name);
    person.set('addresses', [address]);

    let addresses = person.get('addresses');

    await person.save();
    assert.equal(name.get('first'), 'Ned', 'fragment correctly updated');
    assert.equal(
      address.get('street'),
      '1 Red Keep',
      'fragment array fragment correctly updated'
    );
    assert.equal(
      addresses.get('lastObject.street'),
      '1 Godswood',
      'fragment array fragment correctly updated'
    );
    assert.equal(
      addresses.get('length'),
      2,
      'fragment array fragment correctly updated'
    );
  });

  test('the adapter can update fragments on reload', async function (assert) {
    let data = {
      name: {
        first: 'Brandon',
        last: 'Stark',
      },
      addresses: [
        {
          street: '1 Great Keep',
          city: 'Winterfell',
          region: 'North',
          country: 'Westeros',
        },
      ],
    };

    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: data,
      },
    });

    let payload = {
      person: copy(data, true),
    };

    payload.person.id = 1;
    payload.person.name.first = 'Bran';
    payload.person.addresses[0].street = '1 Broken Tower';

    server.get('/people/1', () => {
      return [
        200,
        { 'Content-Type': 'application/json' },
        JSON.stringify(payload),
      ];
    });

    const person = await store.find('person', 1);

    // Access values that will change to prime CP cache
    person.get('name.first');
    person.get('addresses.firstObject.street');

    await person.reload();

    let name = person.get('name');
    let addresses = person.get('addresses');

    assert.equal(name.get('first'), 'Bran', 'fragment correctly updated');
    assert.equal(
      addresses.get('firstObject.street'),
      '1 Broken Tower',
      'fragment array fragment correctly updated'
    );
  });

  /*
    Currently in certain annoying cases in Ember, including aliases or proxies that are actively observed,
    CPs are consumed as soon as they are changed. If we are not careful, this can cause infinite loops when
    updating existing fragment data
  */
  test('the adapter can update fragments without infinite loops when CPs are eagerly consumed', async function (assert) {
    let data = {
      name: {
        first: 'Brandon',
        last: 'Stark',
      },
    };

    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: data,
      },
    });

    const person = await store.find('person', 1);
    let personProxy = ObjectProxy.create({ content: person });

    addObserver(personProxy, 'name.first', function () {});
    personProxy.get('name.first');

    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: data,
      },
    });

    assert.equal(person.get('name.first'), 'Brandon');
  });

  // TODO: The data in the adapter response is not actually changing here, which
  // means that the property actually _shouldn't_ be notified. Doing so requires
  // value diffing of deserialized model data, which means either saving a copy of
  // the data before giving it to the fragment
  skip('fragment array properties are notified on save', async function (assert) {
    // The extra assertion comes from deprecation checking
    // assert.expect(2);

    let data = {
      name: {
        first: 'Eddard',
        last: 'Stark',
      },
      addresses: [
        {
          street: '1 Great Keep',
          city: 'Winterfell',
          region: 'North',
          country: 'Westeros',
        },
      ],
    };

    // eslint-disable-next-line ember/no-classic-classes
    let PersonObserver = EmberObject.extend({
      person: null,
      observer: observer('person.addresses.[]', function () {
        assert.ok(true, 'The array change was observed');
      }),
    });

    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: data,
      },
    });

    let payload = {
      person: copy(data, true),
    };
    payload.person.id = 1;

    server.put('/people/1', () => {
      return [
        200,
        { 'Content-Type': 'application/json' },
        JSON.stringify(payload),
      ];
    });

    const person = await store.find('person', 1);
    PersonObserver.create({ person: person });
    return person.save();
  });

  // TODO(igor) figure out why length is different the first time this assertion is called.
  skip('fragment array properties are notified on reload', async function (assert) {
    // The extra assertion comes from deprecation checking
    // assert.expect(2);
    class Army extends Model {
      @attr('string') name;
      @array() soldiers;
    }

    owner.register('model:army', Army);

    let data = {
      name: 'Golden Company',
      soldiers: ['Aegor Rivers', 'Jon Connington', 'Tristan Rivers'],
    };

    // eslint-disable-next-line ember/no-classic-classes
    let ArmyObserver = EmberObject.extend({
      army: null,
      observer: observer('army.soldiers.[]', function () {
        assert.equal(
          this.army.soldiers.length,
          2,
          'The array change to was observed'
        );
      }),
    });

    store.push({
      data: {
        type: 'army',
        id: 1,
        attributes: data,
      },
    });

    let payload = {
      army: copy(data, true),
    };
    payload.army.id = 1;
    payload.army.soldiers.shift();

    server.get('/armies/1', () => {
      return [
        200,
        { 'Content-Type': 'application/json' },
        JSON.stringify(payload),
      ];
    });

    const army = await store.find('army', 1);
    ArmyObserver.create({ army: army });
    return army.reload();
  });

  test('string array can be rolled back on failed save', async function (assert) {
    // assert.expect(3);

    let data = {
      name: 'Golden Company',
      soldiers: ['Aegor Rivers', 'Jon Connington', 'Tristan Rivers'],
    };

    class Army extends Model {
      @attr('string') name;
      @array() soldiers;
    }

    owner.register('model:army', Army);

    store.push({
      data: {
        type: 'army',
        id: 1,
        attributes: data,
      },
    });

    server.get('/armies', () => {
      return [500, { 'Content-Type': 'application/json' }];
    });

    const army = await store.find('army', 1);
    const soliders = army.get('soldiers');
    soliders.pushObject('Lysono Maar');
    soliders.removeObject('Jon Connington');

    assert.deepEqual(soliders.toArray(), [
      'Aegor Rivers',
      'Tristan Rivers',
      'Lysono Maar',
    ]);

    await assert.rejects(army.save());

    army.rollbackAttributes();

    assert.deepEqual(soliders.toArray(), [
      'Aegor Rivers',
      'Jon Connington',
      'Tristan Rivers',
    ]);
  });

  test('existing fragments can be rolled back on failed save', async function (assert) {
    // assert.expect(3);

    let data = {
      name: {
        first: 'Eddard',
        last: 'Stark',
      },
      addresses: [
        {
          street: '1 Great Keep',
          city: 'Winterfell',
          region: 'North',
          country: 'Westeros',
        },
      ],
    };

    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: data,
      },
    });

    server.put('/armies/1', () => {
      return [500, { 'Content-Type': 'application/json' }];
    });

    const mrStark = await store.find('person', 1);

    const name = mrStark.get('name');
    const address = mrStark.get('addresses.firstObject');

    name.set('first', 'BadFirstName');
    name.set('last', 'BadLastName');
    address.set('street', 'BadStreet');

    await assert.rejects(mrStark.save());

    mrStark.rollbackAttributes();

    assert.equal(
      `${name.get('first')} ${name.get('last')}`,
      'Eddard Stark',
      'fragment name rolled back'
    );
    assert.equal(
      address.get('street'),
      '1 Great Keep',
      'fragment array fragment correctly rolled back'
    );
  });

  test('fragments with default values are rolled back to uncommitted state after failed save', async function (assert) {
    class Address extends MF.Fragment {
      @attr('string') line1;
      @attr('string') line2;
    }

    owner.register('model:address', Address);

    class PersonWithDefaults extends Model {
      @fragment('address', { defaultValue: {} }) address;
      @fragmentArray('address', { defaultValue: [{}] }) addresses;
    }

    owner.register('model:person', PersonWithDefaults);

    const person = store.createRecord('person');
    const address = person.get('address');
    const addresses = person.get('addresses');

    assert.equal(
      address._internalModel.currentState.stateName,
      'root.loaded.created.uncommitted',
      'fragment state before save'
    );
    assert.equal(
      addresses.firstObject._internalModel.currentState.stateName,
      'root.loaded.created.uncommitted',
      'fragment array state before save'
    );

    server.post('/people', () => {
      const response = {
        errors: [{ code: 'custom-error-code' }],
      };
      return [
        400,
        { 'Content-Type': 'application/json' },
        JSON.stringify(response),
      ];
    });

    let savePromise = person.save();

    assert.equal(
      address._internalModel.currentState.stateName,
      'root.loaded.created.inFlight',
      'fragment state during save'
    );
    assert.equal(
      addresses.firstObject._internalModel.currentState.stateName,
      'root.loaded.created.inFlight',
      'fragment array state during save'
    );

    await assert.rejects(
      savePromise,
      (ex) => ex.errors[0].code === 'custom-error-code'
    );

    assert.equal(
      address._internalModel.currentState.stateName,
      'root.loaded.created.uncommitted',
      'fragment state after save'
    );
    assert.equal(
      addresses.firstObject._internalModel.currentState.stateName,
      'root.loaded.created.uncommitted',
      'fragment array state after save'
    );

    // unload will fail if the record is in-flight
    person.unloadRecord();

    assert.equal(
      address._internalModel.currentState.stateName,
      'root.empty',
      'fragment state after unload'
    );
    assert.equal(
      addresses.firstObject._internalModel.currentState.stateName,
      'root.empty',
      'fragment array state after unload'
    );
  });

  test('setting an array does not error on save', async function (assert) {
    assert.expect(0);
    class Army extends Model {
      @array('string') soldiers;
    }

    let data = {
      soldiers: ['Aegor Rivers', 'Jon Connington', 'Tristan Rivers'],
    };
    let payload = {
      army: copy(data, true),
    };
    owner.register('model:army', Army);

    const army = store.createRecord('army');
    server.post('/armies', () => {
      return [
        200,
        { 'Content-Type': 'application/json' },
        JSON.stringify(payload),
      ];
    });
    army.set('soldiers', ['Aegor Rivers', 'Jon Connington', 'Tristan Rivers']);
    await army.save();
  });

  test('change fragment attributes while save is in-flight', async function (assert) {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          name: {
            first: 'Tyrion',
            last: 'Lannister',
          },
          addresses: [
            {
              street: '1 Sky Cell',
              city: 'Eyre',
              region: 'Vale of Arryn',
              country: 'Westeros',
            },
          ],
        },
      },
    });

    server.put('/people/1', () => {
      return [200, { 'Content-Type': 'application/json' }, '{}'];
    });

    const person = await store.find('person', 1);
    const name = person.get('name');

    // set the value and save
    name.set('first', 'Tywin');
    const savePromise = person.save();

    // change the value while in-flight
    name.set('first', 'Jamie');

    await savePromise;

    assert.equal(name.get('first'), 'Jamie');
    assert.ok(name.get('hasDirtyAttributes'), 'fragment is dirty');
    assert.ok(person.get('hasDirtyAttributes'), 'owner record is dirty');

    // revert to the saved value
    name.set('first', 'Tywin');

    assert.ok(!name.get('hasDirtyAttributes'), 'fragment is clean');
    assert.ok(!person.get('hasDirtyAttributes'), 'owner record is clean');
  });

  test('change fragment value while save is in-flight', async function (assert) {
    const data = {
      name: {
        first: 'Eddard',
        last: 'Stark',
      },
      addresses: [
        {
          street: '1 Great Keep',
          city: 'Winterfell',
          region: 'North',
          country: 'Westeros',
        },
      ],
    };

    const person = store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: data,
      },
    });

    const payload = {
      person: {
        id: 1,
        name: null,
      },
    };

    server.put('/people/1', () => {
      return [
        200,
        { 'Content-Type': 'application/json' },
        JSON.stringify(payload),
      ];
    });

    assert.equal(person.get('name.first'), 'Eddard');
    const savePromise = person.save();

    // while save is in-flight, set the fragment
    person.set('name', null);

    assert.equal(person.get('name'), null);
    assert.ok(person.get('hasDirtyAttributes'), 'record is dirty');

    // save response confirms the null value
    await savePromise;

    assert.ok(!person.get('hasDirtyAttributes'), 'record is clean');
  });

  test('initializing a fragment, saving and then updating that fragment', async function (assert) {
    const component = store.createRecord('component', {
      id: 10,
      type: 'chart',
      options: {},
    });

    server.post('/components', () => [204]);
    server.put('/components/:id', () => [204]);

    await component.save();

    assert.ok(
      !component.get('hasDirtyAttributes'),
      'component record is not dirty'
    );

    component.options.lastOrder = { products: [] };
    component.options.lastOrder.products.pushObject({ name: 'Light Saber' });

    assert.ok(component.get('hasDirtyAttributes'), 'component record is dirty');

    await component.save();

    assert.ok(
      !component.get('hasDirtyAttributes'),
      'component record is not dirty after save'
    );

    component.options.lastOrder.products.createFragment({ name: 'Baby Yoda' });
    assert.ok(component.get('hasDirtyAttributes'), 'component record is dirty');
  });
});
