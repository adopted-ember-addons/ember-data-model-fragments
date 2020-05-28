import { isEmpty } from '@ember/utils';
import { run, schedule } from '@ember/runloop';
import { A, isArray } from '@ember/array';
import EmberObject from '@ember/object';
import { all } from 'rsvp';
import DS from 'ember-data';
import MF from 'ember-data-model-fragments';
import { module, test } from 'qunit';
import { setupApplicationTest } from 'ember-qunit';
import Address from 'dummy/models/address';

let owner, store, people;

module('unit - `MF.fragmentArray` property', function(hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function() {
    this.teardown = function() {
      owner = null;
      store = null;
      people = null;
    };
  });

  hooks.beforeEach(function(assert) {
    owner = this.owner;

    store = owner.lookup('service:store');

    assert.expectNoDeprecation();

    people = [
      {
        id: 1,
        nickName: 'Tyrion Lannister',
        addresses: [
          {
            street: '1 Sky Cell',
            city: 'Eyre',
            region: 'Vale of Arryn',
            country: 'Westeros'
          },
          {
            street: '1 Tower of the Hand',
            city: 'King\'s Landing',
            region: 'Crownlands',
            country: 'Westeros'
          }
        ]
      },
      {
        id: 2,
        nickName: 'Eddard Stark',
        addresses: [
          {
            street: '1 Great Keep',
            city: 'Winterfell',
            region: 'North',
            country: 'Westeros'
          }
        ]
      },
      {
        id: 3,
        nickName: 'Jojen Reed',
        addresses: null
      }
    ];
  });

  function pushPerson(id) {
    store.push({
      data: {
        type: 'person',
        id: id,
        attributes: A(people).findBy('id', id)
      }
    });
  }

  test('properties are instances of `MF.FragmentArray`', function(assert) {
    run(() => {
      pushPerson(1);

      return store.find('person', 1).then(person => {
        let addresses = person.get('addresses');

        assert.ok(isArray(addresses), 'property is array-like');
        assert.ok(addresses instanceof MF.FragmentArray, 'property is an instance of `MF.FragmentArray`');
      });
    });
  });

  test('arrays of object literals are converted into instances of `MF.Fragment`', function(assert) {
    run(() => {
      pushPerson(1);

      return store.find('person', 1).then(person => {
        let addresses = person.get('addresses');

        assert.ok(addresses.every(address => {
          return address instanceof Address;
        }), 'each fragment is a `MF.Fragment` instance');
      });
    });
  });

  test('fragments created through the store can be added to the fragment array', function(assert) {
    run(() => {
      pushPerson(1);

      return store.find('person', 1).then(person => {
        let addresses = person.get('addresses');
        let length = addresses.get('length');

        let address = store.createFragment('address', {
          street: '1 Dungeon Cell',
          city: 'King\'s Landing',
          region: 'Crownlands',
          country: 'Westeros'
        });

        addresses.addFragment(address);

        assert.equal(addresses.get('length'), length + 1, 'address property size is correct');
        assert.equal(addresses.indexOf(address), length, 'new fragment is in correct location');
      });
    });
  });

  test('changing the fragment array is reflected in parent changedAttribtues', function(assert) {
    pushPerson(1);

    return store.find('person', 1).then(person => {
      let addresses = person.get('addresses');

      let address = store.createFragment('address', {
        street: '1 Dungeon Cell',
        city: 'King\'s Landing',
        region: 'Crownlands',
        country: 'Westeros'
      });
      assert.deepEqual(person.changedAttributes().addresses, undefined, 'a frehsly pushed object has no changes');
      addresses.addFragment(address);

      // This is the current behavior but seems not great, we should return a better diff objectt
      assert.deepEqual(person.changedAttributes().addresses, [addresses, addresses], 'changed arrays are indicated in the diff object');

      addresses.rollbackAttributes();
      assert.deepEqual(person.changedAttributes().addresses, undefined, 'there are no changes after a rollback');
      addresses.objectAt(0).set('street', 'Changed Streett');

      // This is the current behavior but seems not great, we should return a better diff objectt
      assert.deepEqual(person.changedAttributes().addresses, [addresses, addresses], 'changing a property on a element of the array marks the array as having changedAttribtuest');
      addresses.rollbackAttributes();
      assert.deepEqual(person.changedAttributes().addresses, undefined, 'there are no changes after a rollback');
    });
  });

  test('adding a non-fragment model or object literal throws an error', function(assert) {
    run(() => {
      pushPerson(1);

      return store.find('person', 1).then(person => {
        let addresses = person.get('addresses');

        assert.throws(() => {
          let otherPerson = store.createRecord('person');

          addresses.addFragment(otherPerson);
        }, 'error is thrown when adding a DS.Model instance');
      });
    });
  });

  test('adding fragments from other records throws an error', function(assert) {
    run(() => {
      pushPerson(1);
      pushPerson(2);

      return all([
        store.find('person', 1),
        store.find('person', 2)
      ]).then(people => {
        let address = people[0].get('addresses.firstObject');

        assert.throws(() => {
          people[1].get('addresses').addFragment(address);
        }, 'error is thrown when adding a fragment from another record');
      });
    });
  });

  test('setting to an array of fragments is allowed', function(assert) {
    run(() => {
      pushPerson(1);

      return store.find('person', 1).then(person => {
        let addresses = person.get('addresses');

        let address = store.createFragment('address', {
          street: '1 Dungeon Cell',
          city: 'King\'s Landing',
          region: 'Crownlands',
          country: 'Westeros'
        });

        person.set('addresses', [address]);

        assert.equal(person.get('addresses'), addresses, 'fragment array is the same object');
        assert.equal(person.get('addresses.length'), 1, 'fragment array has the correct length');
        assert.equal(person.get('addresses.firstObject'), address, 'fragment array contains the new fragment');
      });
    });
  });

  test('defaults to an empty array', function(assert) {
    run(() => {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {}
        }
      });

      store.push({
        data: {
          type: 'person',
          id: 2,
          attributes: {}
        }
      });

      return store.find('person', 1).then(person => {
        assert.ok(isArray(person.get('addresses')), 'defaults to an array');
        assert.ok(isEmpty(person.get('addresses')), 'default array is empty');

        store.find('person', 2).then(person2 => {
          assert.ok(person.get('addresses') !== person2.get('addresses'), 'default array is unique');
        });
      });
    });
  });

  test('default value can be null', function(assert) {
    run(() => {
      pushPerson(1);

      return store.find('person', 1).then(person => {
        assert.equal(person.get('hobbies'), null, 'defaults to null');

        let hobbies = [
          store.createFragment('hobby', {
            name: 'guitar'
          })
        ];

        person.set('hobbies', hobbies);
        assert.equal(person.get('hobbies.length'), 1, 'can be set to an array');
      });
    });
  });

  test('null values are allowed', function(assert) {
    run(() => {
      pushPerson(3);

      return store.find('person', 3).then(person => {
        assert.equal(person.get('addresses'), null, 'property is null');
      });
    });
  });

  test('setting to null is allowed', function(assert) {
    run(() => {
      pushPerson(1);

      return store.find('person', 1).then(person => {
        person.set('addresses', null);

        assert.equal(person.get('addresses'), null, 'property is null');
      });
    });
  });

  test('fragments are created from an array of object literals when creating a record', function(assert) {
    run(() => {
      let address = {
        street: '1 Sea Tower',
        city: 'Pyke',
        region: 'Iron Islands',
        country: 'Westeros'
      };

      let person = store.createRecord('person', {
        name: {
          first: 'Balon',
          last: 'Greyjoy'
        },
        addresses: [address]
      });

      assert.ok(person.get('addresses.firstObject') instanceof MF.Fragment, 'a `MF.Fragment` instance is created');
      assert.equal(person.get('addresses.firstObject.street'), address.street, 'fragment has correct values');
    });
  });

  test('setting a fragment array to an array of to an object literals creates new fragments', function(assert) {
    let address = {
      street: '1 Great Keep',
      city: 'Pyke',
      region: 'Iron Islands',
      country: 'Westeros'
    };

    run(() => {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            name: {
              first: 'Asha',
              last: 'Greyjoy'
            },
            addresses: null
          }
        }
      });

      return store.find('person', 1).then(person => {
        person.set('addresses', [address]);

        assert.ok(person.get('addresses.firstObject') instanceof MF.Fragment, 'a `MF.Fragment` instance is created');
        assert.equal(person.get('addresses.firstObject.street'), address.street, 'fragment has correct values');
      });
    });
  });

  test('setting a fragment array to an array of object literals reuses an existing fragments', function(assert) {
    let newAddress = {
      street: '1 Great Keep',
      city: 'Winterfell',
      region: 'North',
      country: 'Westeros'
    };

    run(() => {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            name: {
              first: 'Theon',
              last: 'Greyjoy'
            },
            addresses: [
              {
                street: '1 Great Keep',
                city: 'Pyke',
                region: 'Iron Islands',
                country: 'Westeros'
              }
            ]
          }
        }
      });

      return store.find('person', 1).then(person => {
        let address = person.get('addresses.firstObject');

        person.set('addresses', [newAddress]);

        assert.equal(address, person.get('addresses.firstObject'), 'fragment instances are reused');
        assert.equal(person.get('addresses.firstObject.street'), newAddress.street, 'fragment has correct values');
      });
    });
  });

  test('setting to an array of non-fragments throws an error', function(assert) {
    run(() => {
      pushPerson(1);

      return store.find('person', 1).then(person => {
        assert.throws(() => {
          person.set('addresses', ['address']);
        }, 'error is thrown when setting to an array of non-fragments');
      });
    });
  });

  test('fragments can have default values', function(assert) {
    run(() => {
      let defaultValue = [
        {
          street: '1 Throne Room',
          city: 'King\'s Landing',
          region: 'Crownlands',
          country: 'Westeros'
        }
      ];

      let Throne = DS.Model.extend({
        name: DS.attr('string'),
        addresses: MF.fragmentArray('address', { defaultValue: defaultValue })
      });

      owner.register('model:throne', Throne);

      let throne = store.createRecord('throne', { name: 'Iron' });

      assert.equal(throne.get('addresses.firstObject.street'), defaultValue[0].street, 'the default value is used when the value has not been specified');

      throne.set('addresses', null);
      assert.equal(throne.get('addresses'), null, 'the default value is not used when the value is set to null');

      throne = store.createRecord('throne', { name: 'Iron', addresses: null });
      assert.equal(throne.get('addresses'), null, 'the default value is not used when the value is initialized to null');
    });
  });

  test('fragment default values can be functions', function(assert) {
    run(() => {
      let defaultValue = [
        {
          street: '1 Great Keep',
          city: 'Winterfell',
          region: 'North',
          country: 'Westeros'
        }
      ];

      let Sword = DS.Model.extend({
        name: DS.attr('string'),
        addresses: MF.fragmentArray('address', { defaultValue() { return defaultValue; } })
      });

      owner.register('model:sword', Sword);

      let sword = store.createRecord('sword', { name: 'Ice' });

      assert.equal(sword.get('addresses.firstObject.street'), defaultValue[0].street, 'the default value is correct');
    });
  });

  test('fragment default values that are functions are not deep copied', function(assert) {
    run(() => {
      let defaultValue = [
        {
          street: '1 Great Keep',
          city: 'Winterfell',
          region: 'North',
          country: 'Westeros',
          uncopyableObject: EmberObject.create({ item: 'Iron Throne' })  // Will throw an error if copied
        }
      ];

      let Sword = DS.Model.extend({
        name: DS.attr('string'),
        addresses: MF.fragmentArray('address', { defaultValue() { return defaultValue; } })
      });

      owner.register('model:sword', Sword);

      let sword = store.createRecord('sword', { name: 'Ice' });

      assert.equal(sword.get('addresses.firstObject.street'), defaultValue[0].street, 'the default value is correct');
    });
  });

  test('destroy a fragment array which was set to null', function(assert) {
    return run(() => {
      pushPerson(1);

      return store.find('person', 1).then(person => {
        let addresses = person.get('addresses');
        let firstAddress = addresses.objectAt(0);
        let secondAddress = addresses.objectAt(1);
        person.set('addresses', null);

        person.destroy();

        schedule('destroy', () => {
          assert.ok(person.get('isDestroying'), 'the model is being destroyed');
          assert.ok(addresses.get('isDestroying'), 'the fragment array is being destroyed');
          assert.ok(firstAddress.get('isDestroying'), 'the first fragment is being destroyed');
          assert.ok(secondAddress.get('isDestroying'), 'the second fragment is being destroyed');
        });
      });
    });
  });

  test('destroy a fragment which was removed from the fragment array', function(assert) {
    return run(() => {
      pushPerson(1);

      return store.find('person', 1).then(person => {
        let addresses = person.get('addresses');
        let firstAddress = addresses.objectAt(0);
        let secondAddress = addresses.objectAt(1);
        addresses.removeAt(0);

        person.destroy();

        schedule('destroy', () => {
          assert.ok(person.get('isDestroying'), 'the model is being destroyed');
          assert.ok(addresses.get('isDestroying'), 'the fragment array is being destroyed');
          assert.ok(firstAddress.get('isDestroying'), 'the removed fragment is being destroyed');
          assert.ok(secondAddress.get('isDestroying'), 'the remaining fragment is being destroyed');
        });
      });
    });
  });
});
