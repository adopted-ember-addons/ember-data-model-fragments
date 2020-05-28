import { isEmpty } from '@ember/utils';
import { run } from '@ember/runloop';
import { A, isArray } from '@ember/array';
import { module, test } from 'qunit';
import { setupApplicationTest } from 'ember-qunit';
import { copy } from '@ember/object/internals';

let store, people;

function pushPerson(id) {
  store.push({
    data: {
      type: 'person',
      id: id,
      attributes: copy(A(people).findBy('id', id), true)
    }
  });
}

module('integration - Dependent State', function(hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function(assert) {
    store = this.owner.lookup('service:store');
    assert.expectNoDeprecation();
    people = [
      {
        id: 1,
        name: {
          first: 'Tyrion',
          last: 'Lannister'
        },
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
        ],
        titles: ['Hand of the King', 'Master of Coin']
      }
    ];
  });

  hooks.afterEach(function() {
    store = null;
    people = null;
  });

  test('changing a fragment property dirties the fragment and owner record', function(assert) {
    run(() => {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            name: {
              first: 'Jamie',
              last: 'Lannister'
            }
          }
        }
      });

      return store.find('person', 1).then(person => {
        let name = person.get('name');

        name.set('first', 'Cercei');

        assert.ok(name.get('hasDirtyAttributes'), 'fragment is dirty');
        assert.ok(person.get('hasDirtyAttributes'), 'owner record is dirty');
      });
    });
  });

  test('setting a fragment property to an object literal dirties the fragment and owner record', function(assert) {
    run(() => {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            name: {
              first: 'Visenya',
              last: 'Targaryen'
            }
          }
        }
      });

      return store.find('person', 1).then(person => {
        let name = person.get('name');

        person.set('name', {
          first: 'Rhaenys'
        });

        assert.ok(name.get('hasDirtyAttributes'), 'fragment is dirty');
        assert.ok(person.get('hasDirtyAttributes'), 'owner record is dirty');
      });
    });
  });

  test('setting a fragment property with an object literal to the same value does not dirty the fragment or owner record', function(assert) {
    run(() => {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            name: {
              first: 'Samwell',
              last: 'Tarly'
            }
          }
        }
      });

      return store.find('person', 1).then(person => {
        let name = person.get('name');

        person.set('name', {
          first: 'Samwell',
          last: 'Tarly'
        });

        assert.ok(!name.get('hasDirtyAttributes'), 'fragment is clean');
        assert.ok(!person.get('hasDirtyAttributes'), 'owner record is clean');
      });
    });
  });

  test('restoring a fragment property to its original state returns the fragment and owner record to a clean state', function(assert) {
    run(() => {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            name: {
              first: 'Hoster',
              last: 'Tully'
            }
          }
        }
      });

      return store.find('person', 1).then(person => {
        let name = person.get('name');

        name.set('first', 'Brynden');
        name.set('first', 'Hoster');

        assert.ok(!name.get('hasDirtyAttributes'), 'fragment is clean');
        assert.ok(!person.get('hasDirtyAttributes'), 'owner record is clean');
      });
    });
  });

  test('restoring a fragment property to its original state when the owner record was dirty returns the fragment to a clean state maintains the owner record\'s dirty state', function(assert) {
    run(() => {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            name: {
              first: 'Jorah',
              last: 'Mormont'
            }
          }
        }
      });

      return store.find('person', 1).then(person => {
        let name = person.get('name');

        // Dirty the owner record
        person.set('title', 'Lord Commander');

        name.set('first', 'Jeor');
        name.set('first', 'Jorah');

        assert.ok(!name.get('hasDirtyAttributes'), 'fragment is clean');
        assert.ok(
          person.get('hasDirtyAttributes'),
          'owner record is still dirty'
        );
      });
    });
  });

  test('rolling back the owner record returns fragment and owner record to a clean state', function(assert) {
    run(() => {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            name: {
              first: 'Catelyn',
              last: 'Stark'
            }
          }
        }
      });

      return store.find('person', 1).then(person => {
        let name = person.get('name');

        name.set('last', 'Tully');

        person.rollbackAttributes();

        assert.ok(!name.get('hasDirtyAttributes'), 'fragment is clean');
        assert.ok(!person.get('hasDirtyAttributes'), 'owner record is clean');
      });
    });
  });

  test('a record can be rolled back multiple times', function(assert) {
    run(() => {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            name: {
              first: 'Arya',
              last: 'Stark'
            }
          }
        }
      });

      return store.find('person', 1).then(person => {
        let name = person.get('name');

        name.set('last', '');
        person.rollbackAttributes();

        assert.equal(name.get('last'), 'Stark', 'fragment has correct values');
        assert.ok(!name.get('hasDirtyAttributes'), 'fragment is clean');
        assert.ok(!person.get('hasDirtyAttributes'), 'owner record is clean');

        name.set('last', '');
        person.rollbackAttributes();

        assert.equal(name.get('last'), 'Stark', 'fragment has correct values');
        assert.ok(!name.get('hasDirtyAttributes'), 'fragment is clean');
        assert.ok(!person.get('hasDirtyAttributes'), 'owner record is clean');
      });
    });
  });

  test('rolling back a fragment returns the fragment and the owner record to a clean state', function(assert) {
    run(() => {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            name: {
              first: 'Sansa',
              last: 'Stark'
            }
          }
        }
      });

      return store.find('person', 1).then(person => {
        let name = person.get('name');

        // Dirty the fragment
        name.set('last', 'Lannister');

        name.rollbackAttributes();

        assert.ok(!name.get('hasDirtyAttributes'), 'fragment is clean');
        assert.ok(!person.get('hasDirtyAttributes'), 'owner record is clean');
      });
    });
  });

  test('changing a fragment property then rolling back the owner record preserves the fragment\'s owner', function(assert) {
    run(() => {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            name: {
              first: 'Arya',
              last: 'Stark'
            }
          }
        }
      });

      return store.find('person', 1).then(person => {
        let name = person.get('name');

        person.set('name', null);

        person.rollbackAttributes();

        assert.equal(name.get('person'), person, 'fragment owner is preserved');
      });
    });
  });

  test('rolling back a fragment when the owner record is dirty returns the fragment to a clean state and maintains the owner record\'s dirty state', function(assert) {
    run(() => {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            name: {
              first: 'Sansa',
              last: 'Stark'
            }
          }
        }
      });

      return store.find('person', 1).then(person => {
        let name = person.get('name');

        // Dirty the owner record and fragment
        person.set('title', 'Heir to Winterfell');
        name.set('last', 'Lannister');

        name.rollbackAttributes();

        assert.ok(!name.get('hasDirtyAttributes'), 'fragment is clean');
        assert.ok(
          person.get('hasDirtyAttributes'),
          'owner record is still dirty'
        );
      });
    });
  });

  test('a fragment property that is set to null can be rolled back', function(assert) {
    run(() => {
      pushPerson(1);

      return store.find('person', 1).then(person => {
        let name = person.get('name');

        person.set('name', null);

        assert.ok(person.get('hasDirtyAttributes'), 'owner record is dirty');

        person.rollbackAttributes();

        assert.deepEqual(person.get('name'), name, 'property is restored');
        assert.ok(!name.get('hasDirtyAttributes'), 'fragment is clean');
        assert.ok(!person.get('hasDirtyAttributes'), 'owner record is clean');
      });
    });
  });

  test('a fragment property that is null can be rolled back', function(assert) {
    run(() => {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {}
        }
      });

      return store.find('person', 1).then(person => {
        let name = person.get('name');

        assert.equal(name, undefined, 'property is null');

        person.set(
          'name',
          store.createFragment('name', { first: 'Rob', last: 'Stark' })
        );

        assert.ok(person.get('hasDirtyAttributes'), 'owner record is dirty');

        person.rollbackAttributes();

        assert.equal(person.get('name'), null, 'property is null again');
        assert.ok(!person.get('hasDirtyAttributes'), 'owner record is clean');
      });
    });
  });

  test('changing a fragment array property with object literals dirties the fragment and owner record', function(assert) {
    run(() => {
      pushPerson(1);

      return store.find('person', 1).then(person => {
        let addresses = person.get('addresses');

        person.set('addresses', [
          {
            street: '1 Sky Cell',
            city: 'Eyre',
            region: 'Vale of Arryn',
            country: 'Westeros'
          },
          {
            street: '1 Dungeon Cell',
            city: 'King\'s Landing',
            region: 'Crownlands',
            country: 'Westeros'
          }
        ]);

        assert.ok(
          addresses.get('hasDirtyAttributes'),
          'fragment array is dirty'
        );
        assert.ok(person.get('hasDirtyAttributes'), 'owner record is dirty');
      });
    });
  });

  test('adding to a fragment array property with object literals dirties the fragment and owner record', function(assert) {
    run(() => {
      pushPerson(1);

      return store.find('person', 1).then(person => {
        let addresses = person.get('addresses');

        addresses.pushObject({
          street: '1 Dungeon Cell',
          city: 'King\'s Landing',
          region: 'Crownlands',
          country: 'Westeros'
        });

        assert.ok(
          addresses.get('hasDirtyAttributes'),
          'fragment array is dirty'
        );
        assert.ok(person.get('hasDirtyAttributes'), 'owner record is dirty');
      });
    });
  });

  test('setting a fragment property with object literals to the same values does not dirty the fragment or owner record', function(assert) {

    run(() => {
      pushPerson(1);

      return store.find('person', 1).then(person => {
        let addresses = person.get('addresses');

        person.set('addresses', people[0].addresses);

        assert.ok(!addresses.get('hasDirtyAttributes'), 'fragment is clean');
        assert.ok(!person.get('hasDirtyAttributes'), 'owner record is clean');
      });
    });
  });

  test('adding a fragment to a fragment array dirties the fragment array and owner record', function(assert) {
    run(() => {
      pushPerson(1);

      return store.find('person', 1).then(person => {
        let addresses = person.get('addresses');

        addresses.createFragment('address', {
          street: '1 Dungeon Cell',
          city: 'King\'s Landing',
          region: 'Crownlands',
          country: 'Westeros'
        });

        assert.ok(
          addresses.get('hasDirtyAttributes'),
          'fragment array is dirty'
        );
        assert.ok(person.get('hasDirtyAttributes'), 'owner record is dirty');
      });
    });
  });

  test('removing a fragment from a fragment array dirties the fragment array and owner record', function(assert) {
    run(() => {
      pushPerson(1);

      return store.find('person', 1).then(person => {
        let addresses = person.get('addresses');

        addresses.removeObject(addresses.get('firstObject'));

        assert.ok(
          addresses.get('hasDirtyAttributes'),
          'fragment array is dirty'
        );
        assert.ok(person.get('hasDirtyAttributes'), 'owner record is dirty');
      });
    });
  });

  test('reordering a fragment array dirties the fragment array and owner record', function(assert) {
    run(() => {
      pushPerson(1);

      return store.find('person', 1).then(person => {
        let addresses = person.get('addresses');
        let length = addresses.get('length');

        let address = addresses.popObject();
        addresses.unshiftObject(address);

        assert.equal(
          addresses.get('length'),
          length,
          'fragment array length is maintained'
        );
        assert.ok(
          addresses.get('hasDirtyAttributes'),
          'fragment array is dirty'
        );
        assert.ok(person.get('hasDirtyAttributes'), 'owner record is dirty');
      });
    });
  });

  test('restoring a fragment array to its original order returns the fragment array owner record to a clean state', function(assert) {
    run(() => {
      pushPerson(1);

      return store.find('person', 1).then(person => {
        let addresses = person.get('addresses');

        let address = addresses.popObject();
        addresses.pushObject(address);

        assert.ok(
          !addresses.get('hasDirtyAttributes'),
          'fragment array is clean'
        );
        assert.ok(!person.get('hasDirtyAttributes'), 'owner record is clean');
      });
    });
  });

  test('restoring a fragment array to its original order when the owner record was dirty returns the fragment array to a clean state and maintains the owner record\'s dirty state', function(assert) {
    run(() => {
      pushPerson(1);

      return store.find('person', 1).then(person => {
        let addresses = person.get('addresses');

        // Dirty the owner record
        person.set('title', 'Hand of the King');

        let address = addresses.popObject();
        addresses.pushObject(address);

        assert.ok(
          !addresses.get('hasDirtyAttributes'),
          'fragment array is clean'
        );
        assert.ok(
          person.get('hasDirtyAttributes'),
          'owner record is still dirty'
        );
      });
    });
  });

  test('changing a fragment property in a fragment array dirties the fragment, fragment array, and owner record', function(assert) {
    run(() => {
      pushPerson(1);

      return store.find('person', 1).then(person => {
        let addresses = person.get('addresses');
        let address = addresses.get('firstObject');

        address.set('street', '2 Sky Cell');

        assert.ok(address.get('hasDirtyAttributes'), 'fragment is dirty');
        assert.ok(
          addresses.get('hasDirtyAttributes'),
          'fragment array is dirty'
        );
        assert.ok(person.get('hasDirtyAttributes'), 'owner record is dirty');
      });
    });
  });

  test('restoring a fragment in a fragment array property to its original state returns the fragment, fragment array, and owner record to a clean state', function(assert) {
    run(() => {
      pushPerson(1);

      return store.find('person', 1).then(person => {
        let addresses = person.get('addresses');
        let address = addresses.get('firstObject');

        address.set('street', '2 Sky Cell');
        address.set('street', '1 Sky Cell');

        assert.ok(!address.get('hasDirtyAttributes'), 'fragment is clean');
        assert.ok(
          !addresses.get('hasDirtyAttributes'),
          'fragment array is clean'
        );
        assert.ok(!person.get('hasDirtyAttributes'), 'owner record is clean');
      });
    });
  });

  test('restoring a fragment in a fragment array property to its original state when the fragment array was dirty returns the fragment to a clean state and maintains the fragment array and owner record\'s dirty state', function(assert) {
    run(() => {
      pushPerson(1);

      return store.find('person', 1).then(person => {
        let addresses = person.get('addresses');
        let address = addresses.get('firstObject');

        // Dirty the record array
        addresses.popObject();

        address.set('street', '2 Sky Cell');
        address.set('street', '1 Sky Cell');

        assert.ok(!address.get('hasDirtyAttributes'), 'fragment is clean');
        assert.ok(
          addresses.get('hasDirtyAttributes'),
          'fragment array is still dirty'
        );
        assert.ok(person.get('hasDirtyAttributes'), 'owner record is dirty');
      });
    });
  });

  test('restoring a fragment in a fragment array property to its original state when the owner record was dirty returns the fragment and fragment array to a clean state maintains the owner record\'s dirty state', function(assert) {
    run(() => {
      pushPerson(1);

      return store.find('person', 1).then(person => {
        let addresses = person.get('addresses');
        let address = addresses.get('firstObject');

        address.set('street', '2 Sky Cell');
        address.set('street', '1 Sky Cell');

        // Dirty the owner record
        person.set('title', 'Master of Coin');

        assert.ok(!address.get('hasDirtyAttributes'), 'fragment is clean');
        assert.ok(
          !addresses.get('hasDirtyAttributes'),
          'fragment array is clean'
        );
        assert.ok(
          person.get('hasDirtyAttributes'),
          'owner record is still dirty'
        );
      });
    });
  });

  test('rolling back the owner record returns all fragments in a fragment array property, the fragment array, and owner record to a clean state', function(assert) {
    run(() => {
      pushPerson(1);

      return store.find('person', 1).then(person => {
        let addresses = person.get('addresses');
        let address = addresses.get('firstObject');

        // Dirty the owner record, fragment array, and a fragment
        person.set('title', 'Warden of the West');
        addresses.popObject();
        address.set('street', '2 Sky Cell');

        person.rollbackAttributes();

        assert.ok(!address.get('hasDirtyAttributes'), 'fragment is clean');
        assert.ok(
          !addresses.get('hasDirtyAttributes'),
          'fragment array is clean'
        );
        assert.ok(!person.get('hasDirtyAttributes'), 'owner record is clean');
      });
    });
  });

  test('rolling back the owner record returns all values in an array property, the array, and the owner record to a clean state', function(assert) {
    run(() => {
      pushPerson(1);

      return store.find('person', 1).then(person => {
        let titles = person.get('titles');
        let values = titles.toArray();

        // Dirty the primitive array
        titles.popObject();
        titles.unshiftObject('Giant of Lannister');

        person.rollbackAttributes();

        assert.deepEqual(
          values,
          person.get('titles').toArray(),
          'primitive values are reset'
        );
        assert.ok(!titles.get('hasDirtyAttributes'), 'fragment array is clean');
        assert.ok(!person.get('hasDirtyAttributes'), 'owner record is clean');
      });
    });
  });

  test('rolling back a fragment array returns all fragments, the fragment array, and the owner record to a clean state', function(assert) {
    run(() => {
      pushPerson(1);

      return store.find('person', 1).then(person => {
        let addresses = person.get('addresses');
        let address = addresses.get('firstObject');

        // Dirty the fragment array and a fragment
        addresses.popObject();
        address.set('street', '2 Sky Cell');

        addresses.rollbackAttributes();

        assert.ok(!address.get('hasDirtyAttributes'), 'fragment is clean');
        assert.ok(
          !addresses.get('hasDirtyAttributes'),
          'fragment array is clean'
        );
        assert.ok(!person.get('hasDirtyAttributes'), 'owner record is clean');
      });
    });
  });

  test('rolling back a fragment array when the owner record is dirty returns all fragments and the fragment array to a clean state and retains the owner record\'s dirty state', function(assert) {
    run(() => {
      pushPerson(1);

      return store.find('person', 1).then(person => {
        let addresses = person.get('addresses');
        let address = addresses.get('firstObject');

        // Dirty the owner record, fragment array, and a fragment
        person.set('title', 'Lord of the Westerlands');
        addresses.popObject();
        address.set('street', '2 Sky Cell');

        addresses.rollbackAttributes();

        assert.ok(!address.get('hasDirtyAttributes'), 'fragment is clean');
        assert.ok(
          !addresses.get('hasDirtyAttributes'),
          'fragment array is clean'
        );
        assert.ok(
          person.get('hasDirtyAttributes'),
          'owner record is still dirty'
        );
      });
    });
  });

  test('rolling back a fragment in a fragment array property returns the fragment, fragment array, and owner record to a clean states', function(assert) {
    run(() => {
      pushPerson(1);

      return store.find('person', 1).then(person => {
        let addresses = person.get('addresses');
        let address = addresses.get('firstObject');

        // Dirty a fragment
        address.set('street', '2 Sky Cell');

        address.rollbackAttributes();

        assert.ok(!address.get('hasDirtyAttributes'), 'fragment is clean');
        assert.ok(
          !addresses.get('hasDirtyAttributes'),
          'fragment array is clean'
        );
        assert.ok(!person.get('hasDirtyAttributes'), 'owner record is clean');
      });
    });
  });

  test('rolling back a fragment in a fragment array property when the fragment array is dirty returns the fragment to a clean state and maintains the fragment array and owner record\'s dirty state', function(assert) {
    run(() => {
      pushPerson(1);

      return store.find('person', 1).then(person => {
        let addresses = person.get('addresses');
        let address = addresses.get('firstObject');

        // Dirty fragment array, and a fragment
        addresses.popObject();
        address.set('street', '2 Sky Cell');

        address.rollbackAttributes();

        assert.ok(!address.get('hasDirtyAttributes'), 'fragment is clean');
        assert.ok(
          addresses.get('hasDirtyAttributes'),
          'fragment array is still dirty'
        );
        assert.ok(
          person.get('hasDirtyAttributes'),
          'owner record is still dirty'
        );
      });
    });
  });

  test('rolling back a fragment in a fragment array property when the owner record is dirty returns the fragment and fragment array to a clean state and maintains the owner record\'s dirty state', function(assert) {
    run(() => {
      pushPerson(1);

      return store.find('person', 1).then(person => {
        let addresses = person.get('addresses');
        let address = addresses.get('firstObject');

        // Dirty the owner record, and a fragment
        person.set('title', 'Lord of Casterly Rock');
        address.set('street', '2 Sky Cell');

        address.rollbackAttributes();

        assert.ok(!address.get('hasDirtyAttributes'), 'fragment is clean');
        assert.ok(
          !addresses.get('hasDirtyAttributes'),
          'fragment array is clean'
        );
        assert.ok(
          person.get('hasDirtyAttributes'),
          'owner record is still dirty'
        );
      });
    });
  });

  test('a fragment array property that is set to null can be rolled back', function(assert) {
    run(() => {
      pushPerson(1);

      return store.find('person', 1).then(person => {
        let addresses = person.get('addresses');

        person.set('addresses', null);

        assert.ok(person.get('hasDirtyAttributes'), 'owner record is dirty');

        person.rollbackAttributes();

        assert.equal(
          person.get('addresses'),
          addresses,
          'property is restored'
        );
        assert.ok(
          !addresses.get('hasDirtyAttributes'),
          'fragment array is clean'
        );
        assert.ok(!person.get('hasDirtyAttributes'), 'owner record is clean');
      });
    });
  });

  test('a fragment array property that is null can be rolled back', function(assert) {
    run(() => {
      pushPerson(1);

      return store.find('person', 1).then(person => {
        let hobbies = person.get('hobbies');

        assert.equal(hobbies, null, 'property is null');

        person.set('hobbies', [
          store.createFragment('hobby', {
            name: 'guitar'
          })
        ]);

        assert.ok(person.get('hasDirtyAttributes'), 'owner record is dirty');

        person.rollbackAttributes();

        assert.equal(person.get('hobbies'), null, 'property is null again');
        assert.ok(!person.get('hasDirtyAttributes'), 'owner record is clean');
      });
    });
  });

  test('a fragment array property that is empty can be rolled back', function(assert) {
    run(() => {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {}
        }
      });

      return store.find('person', 1).then(person => {
        let addresses = person.get('addresses');

        assert.ok(
          isArray(addresses) && isEmpty(addresses),
          'property is an empty array'
        );

        person.set('addresses', [
          store.createFragment('address', {
            street: '1 Spear Tower',
            city: 'Sun Spear',
            region: 'Dorne',
            country: 'Westeros'
          })
        ]);

        assert.ok(person.get('hasDirtyAttributes'), 'owner record is dirty');

        person.rollbackAttributes();

        assert.ok(
          isArray(person.get('addresses')) && isEmpty(person.get('addresses')),
          'property is an empty array again'
        );
        assert.ok(!person.get('hasDirtyAttributes'), 'owner record is clean');
      });
    });
  });

  test('pushing a fragment update doesn\'t cause it to become dirty', function(assert) {
    run(() => {
      pushPerson(1);

      return store.find('person', 1).then(person => {
        assert.ok(
          !person.get('hasDirtyAttributes'),
          'person record is not dirty'
        );

        store.push({
          data: {
            type: 'person',
            id: 1,
            attributes: {
              name: { first: 'Jamie' }
            }
          }
        });

        assert.equal(person.get('name.first'), 'Jamie', 'first name updated');
        assert.equal(
          person.get('name.last'),
          'Lannister',
          'last name is the same'
        );
        assert.ok(
          !person.get('hasDirtyAttributes'),
          'person record is not dirty'
        );
      });
    });
  });

  test('pushing a fragment array update doesnt cause it to become dirty', function(assert) {
    run(() => {
      pushPerson(1);

      return store.find('person', 1).then(person => {
        assert.ok(
          !person.get('hasDirtyAttributes'),
          'person record is not dirty'
        );

        store.push({
          data: {
            type: 'person',
            id: 1,
            attributes: {
              addresses: [
                // Yeah, this is pretty weird...
                {},
                {
                  street: '1 Dungeon Cell'
                }
              ]
            }
          }
        });

        assert.equal(
          person.get('addresses.lastObject.street'),
          '1 Dungeon Cell',
          'street updated'
        );
        assert.equal(
          person.get('addresses.lastObject.city'),
          'King\'s Landing',
          'city is the same'
        );
        assert.ok(
          !person.get('hasDirtyAttributes'),
          'person record is not dirty'
        );
      });
    });
  });
});
