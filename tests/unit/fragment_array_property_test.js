import Model, { attr } from '@ember-data/model';
import { fragmentArray } from 'ember-data-model-fragments/attributes';
import { isEmpty } from '@ember/utils';
import { schedule } from '@ember/runloop';
import { A, isArray } from '@ember/array';
import EmberObject from '@ember/object';
import { all } from 'rsvp';
import MF from 'ember-data-model-fragments';
import { module, test } from 'qunit';
import { setupApplicationTest } from '../helpers';
import Address from 'dummy/models/address';

let owner, store, people;

module('unit - `MF.fragmentArray` property', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function () {
    owner = this.owner;

    store = owner.lookup('service:store');

    people = [
      {
        id: 1,
        nickName: 'Tyrion Lannister',
        addresses: [
          {
            street: '1 Sky Cell',
            city: 'Eyre',
            region: 'Vale of Arryn',
            country: 'Westeros',
          },
          {
            street: '1 Tower of the Hand',
            city: "King's Landing",
            region: 'Crownlands',
            country: 'Westeros',
          },
        ],
      },
      {
        id: 2,
        nickName: 'Eddard Stark',
        addresses: [
          {
            street: '1 Great Keep',
            city: 'Winterfell',
            region: 'North',
            country: 'Westeros',
          },
        ],
      },
      {
        id: 3,
        nickName: 'Jojen Reed',
        addresses: null,
      },
    ];
  });

  hooks.afterEach(function () {
    owner = null;
    store = null;
    people = null;
  });

  function pushPerson(id) {
    store.push({
      data: {
        type: 'person',
        id: id,
        attributes: A(people).findBy('id', id),
      },
    });
  }

  test('properties are instances of `MF.FragmentArray`', async function (assert) {
    pushPerson(1);

    const person = await store.findRecord('person', 1);
    const addresses = person.addresses;

    assert.ok(isArray(addresses), 'property is array-like');
    assert.ok(
      addresses instanceof MF.FragmentArray,
      'property is an instance of `MF.FragmentArray`'
    );
  });

  test('arrays of object literals are converted into instances of `MF.Fragment`', async function (assert) {
    pushPerson(1);

    const person = await store.findRecord('person', 1);
    const addresses = person.addresses;

    assert.ok(
      addresses.every((address) => {
        return address instanceof Address;
      }),
      'each fragment is a `MF.Fragment` instance'
    );
  });

  test('fragments created through the store can be added to the fragment array', async function (assert) {
    pushPerson(1);

    const person = await store.findRecord('person', 1);
    const addresses = person.addresses;
    const length = addresses.length;

    const address = store.createFragment('address', {
      street: '1 Dungeon Cell',
      city: "King's Landing",
      region: 'Crownlands',
      country: 'Westeros',
    });

    addresses.addFragment(address);

    assert.equal(
      addresses.length,
      length + 1,
      'address property size is correct'
    );
    assert.equal(
      addresses.indexOf(address),
      length,
      'new fragment is in correct location'
    );
  });

  test('changing the fragment array is reflected in parent changedAttributes', async function (assert) {
    pushPerson(1);

    const person = await store.findRecord('person', 1);
    const addresses = person.addresses;

    const address = store.createFragment('address', {
      street: '1 Dungeon Cell',
      city: "King's Landing",
      region: 'Crownlands',
      country: 'Westeros',
    });
    assert.deepEqual(
      person.changedAttributes(),
      {},
      'a freshly pushed object has no changes'
    );
    addresses.addFragment(address);

    let [oldAddresses, newAddresses] = person.changedAttributes().addresses;
    assert.equal(
      oldAddresses.length,
      2,
      'changedAttributes has the old length'
    );
    assert.equal(
      newAddresses.length,
      3,
      'changedAttributes has the new length'
    );

    addresses.rollbackAttributes();
    assert.deepEqual(
      person.changedAttributes(),
      {},
      'there are no changes after a rollback'
    );
    addresses.objectAt(0).set('street', 'Changed Street');

    [oldAddresses, newAddresses] = person.changedAttributes().addresses;
    assert.equal(
      oldAddresses[0].street,
      '1 Sky Cell',
      'changedAttributes has the old street'
    );
    assert.equal(
      newAddresses[0].street,
      'Changed Street',
      'changedAttributes has the new street'
    );

    addresses.rollbackAttributes();
    assert.deepEqual(
      person.changedAttributes(),
      {},
      'there are no changes after a rollback'
    );
  });

  test('adding a non-fragment model or object literal throws an error', async function (assert) {
    pushPerson(1);

    const person = await store.findRecord('person', 1);
    const addresses = person.addresses;

    assert.expectAssertion(() => {
      const otherPerson = store.createRecord('person');

      addresses.addFragment(otherPerson);
    }, "You can only add 'address' fragments or object literals to this property");
  });

  test('adding fragments from other records throws an error', async function (assert) {
    pushPerson(1);
    pushPerson(2);

    const people = await all([
      store.findRecord('person', 1),
      store.findRecord('person', 2),
    ]);
    const address = people[0].addresses.firstObject;

    assert.expectAssertion(() => {
      people[1].addresses.addFragment(address);
    }, 'Fragments can only belong to one owner, try copying instead');
  });

  test('setting to an array of fragments is allowed', async function (assert) {
    pushPerson(1);

    const person = await store.findRecord('person', 1);
    const addresses = person.addresses;

    const address = store.createFragment('address', {
      street: '1 Dungeon Cell',
      city: "King's Landing",
      region: 'Crownlands',
      country: 'Westeros',
    });

    person.set('addresses', [address]);

    assert.equal(
      person.addresses,
      addresses,
      'fragment array is the same object'
    );
    assert.equal(
      person.addresses.length,
      1,
      'fragment array has the correct length'
    );
    assert.equal(
      person.addresses.firstObject,
      address,
      'fragment array contains the new fragment'
    );
  });

  test('defaults to an empty array', async function (assert) {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {},
      },
    });

    store.push({
      data: {
        type: 'person',
        id: 2,
        attributes: {},
      },
    });

    const person = await store.findRecord('person', 1);
    assert.ok(isArray(person.addresses), 'defaults to an array');
    assert.ok(isEmpty(person.addresses), 'default array is empty');

    const person2 = await store.findRecord('person', 2);
    assert.ok(
      person.addresses !== person2.addresses,
      'default array is unique'
    );
  });

  test('default value can be null', async function (assert) {
    pushPerson(1);

    const person = await store.findRecord('person', 1);
    assert.equal(person.hobbies, null, 'defaults to null');

    const hobbies = [
      store.createFragment('hobby', {
        name: 'guitar',
      }),
    ];

    person.set('hobbies', hobbies);
    assert.equal(person.hobbies.length, 1, 'can be set to an array');
  });

  test('null values are allowed', async function (assert) {
    pushPerson(3);

    const person = await store.findRecord('person', 3);
    assert.equal(person.addresses, null, 'property is null');
  });

  test('setting to null is allowed', async function (assert) {
    pushPerson(1);

    const person = await store.findRecord('person', 1);
    person.set('addresses', null);

    assert.equal(person.addresses, null, 'property is null');
  });

  test('fragments are created from an array of object literals when creating a record', function (assert) {
    const address = {
      street: '1 Sea Tower',
      city: 'Pyke',
      region: 'Iron Islands',
      country: 'Westeros',
    };

    const person = store.createRecord('person', {
      name: {
        first: 'Balon',
        last: 'Greyjoy',
      },
      addresses: [address],
    });

    assert.ok(
      person.addresses.firstObject instanceof MF.Fragment,
      'a `MF.Fragment` instance is created'
    );
    assert.equal(
      person.addresses.firstObject.street,
      address.street,
      'fragment has correct values'
    );
  });

  test('setting a fragment array to an array of to an object literals creates new fragments', async function (assert) {
    const address = {
      street: '1 Great Keep',
      city: 'Pyke',
      region: 'Iron Islands',
      country: 'Westeros',
    };

    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          name: {
            first: 'Asha',
            last: 'Greyjoy',
          },
          addresses: null,
        },
      },
    });

    const person = await store.findRecord('person', 1);
    person.set('addresses', [address]);

    assert.ok(
      person.addresses.firstObject instanceof MF.Fragment,
      'a `MF.Fragment` instance is created'
    );
    assert.equal(
      person.addresses.firstObject.street,
      address.street,
      'fragment has correct values'
    );
  });

  test('setting a fragment array to an array of object literals reuses an existing fragments', async function (assert) {
    const newAddress = {
      street: '1 Great Keep',
      city: 'Winterfell',
      region: 'North',
      country: 'Westeros',
    };

    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          name: {
            first: 'Theon',
            last: 'Greyjoy',
          },
          addresses: [
            {
              street: '1 Great Keep',
              city: 'Pyke',
              region: 'Iron Islands',
              country: 'Westeros',
            },
          ],
        },
      },
    });

    const person = await store.findRecord('person', 1);
    const address = person.addresses.firstObject;

    person.set('addresses', [newAddress]);

    assert.equal(
      address,
      person.addresses.firstObject,
      'fragment instances are reused'
    );
    assert.equal(
      person.addresses.firstObject.street,
      newAddress.street,
      'fragment has correct values'
    );
  });

  test('setting to an array of non-fragments throws an error', async function (assert) {
    pushPerson(1);

    const person = await store.findRecord('person', 1);
    assert.expectAssertion(() => {
      person.set('addresses', ['address']);
    }, "You can only add 'address' fragments or object literals to this property");
  });

  test('fragments can have default values', function (assert) {
    const defaultValue = [
      {
        street: '1 Throne Room',
        city: "King's Landing",
        region: 'Crownlands',
        country: 'Westeros',
      },
    ];

    class Throne extends Model {
      @attr('string') name;
      @fragmentArray('address', { defaultValue: defaultValue }) addresses;
    }

    owner.register('model:throne', Throne);

    let throne = store.createRecord('throne', { name: 'Iron' });

    assert.equal(
      throne.addresses.firstObject.street,
      defaultValue[0].street,
      'the default value is used when the value has not been specified'
    );

    throne.set('addresses', null);
    assert.equal(
      throne.addresses,
      null,
      'the default value is not used when the value is set to null'
    );

    throne = store.createRecord('throne', { name: 'Iron', addresses: null });
    assert.equal(
      throne.addresses,
      null,
      'the default value is not used when the value is initialized to null'
    );
  });

  test('fragment default values can be functions', function (assert) {
    const defaultValue = [
      {
        street: '1 Great Keep',
        city: 'Winterfell',
        region: 'North',
        country: 'Westeros',
      },
    ];

    class Sword extends Model {
      @attr('string') name;
      @fragmentArray('address', {
        defaultValue() {
          return defaultValue;
        },
      })
      addresses;
    }

    owner.register('model:sword', Sword);

    const sword = store.createRecord('sword', { name: 'Ice' });

    assert.equal(
      sword.addresses.firstObject.street,
      defaultValue[0].street,
      'the default value is correct'
    );
  });

  test('fragment default values that are functions are not deep copied', function (assert) {
    const defaultValue = [
      {
        street: '1 Great Keep',
        city: 'Winterfell',
        region: 'North',
        country: 'Westeros',
        uncopyableObject: EmberObject.create({ item: 'Iron Throne' }), // Will throw an error if copied
      },
    ];

    class Sword extends Model {
      @attr('string') name;
      @fragmentArray('address', {
        defaultValue() {
          return defaultValue;
        },
      })
      addresses;
    }

    owner.register('model:sword', Sword);

    const sword = store.createRecord('sword', { name: 'Ice' });

    assert.equal(
      sword.addresses.firstObject.street,
      defaultValue[0].street,
      'the default value is correct'
    );
  });

  test('destroy a fragment array which was set to null', async function (assert) {
    pushPerson(1);

    const person = await store.findRecord('person', 1);
    const addresses = person.addresses;
    const firstAddress = addresses.objectAt(0);
    const secondAddress = addresses.objectAt(1);
    person.set('addresses', null);

    person.unloadRecord();

    schedule('destroy', () => {
      assert.ok(person.isDestroying, 'the model is being destroyed');
      assert.ok(
        addresses.isDestroying,
        'the fragment array is being destroyed'
      );
      assert.ok(
        firstAddress.isDestroying,
        'the first fragment is being destroyed'
      );
      assert.ok(
        secondAddress.isDestroying,
        'the second fragment is being destroyed'
      );
    });
  });

  test('destroy a fragment which was removed from the fragment array', async function (assert) {
    pushPerson(1);

    const person = await store.findRecord('person', 1);
    const addresses = person.addresses;
    const firstAddress = addresses.objectAt(0);
    const secondAddress = addresses.objectAt(1);
    addresses.removeAt(0);

    person.unloadRecord();

    schedule('destroy', () => {
      assert.ok(person.isDestroying, 'the model is being destroyed');
      assert.ok(
        addresses.isDestroying,
        'the fragment array is being destroyed'
      );
      assert.ok(
        firstAddress.isDestroying,
        'the removed fragment is being destroyed'
      );
      assert.ok(
        secondAddress.isDestroying,
        'the remaining fragment is being destroyed'
      );
    });
  });

  test('pass arbitrary props to createFragment', async function (assert) {
    pushPerson(1);

    const person = await store.findRecord('person', 1);
    const address = person.addresses.createFragment({
      street: '1 Dungeon Cell',
      extra: 123,
    });

    assert.equal(address.street, '1 Dungeon Cell', 'street is correct');
    assert.equal(address.extra, 123, 'extra property is correct');
  });
});
