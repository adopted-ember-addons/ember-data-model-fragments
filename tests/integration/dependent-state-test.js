import { isEmpty } from '@ember/utils';
import { A, isArray } from '@ember/array';
import { module, test } from 'qunit';
import { setupApplicationTest } from '../helpers';
import { copy } from 'ember-data-model-fragments/util/copy';

let store, people;

function pushPerson(id) {
  store.push({
    data: {
      type: 'person',
      id: id,
      attributes: copy(A(people).findBy('id', id), true),
    },
  });
}

module('integration - Dependent State', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function () {
    store = this.owner.lookup('service:store');
    people = [
      {
        id: 1,
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
          {
            street: '1 Tower of the Hand',
            city: "King's Landing",
            region: 'Crownlands',
            country: 'Westeros',
          },
        ],
        titles: ['Hand of the King', 'Master of Coin'],
      },
    ];
  });

  hooks.afterEach(function () {
    store = null;
    people = null;
  });

  test('changing a fragment property dirties the fragment and owner record', async function (assert) {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          name: {
            first: 'Jamie',
            last: 'Lannister',
          },
        },
      },
    });

    const person = await store.findRecord('person', 1);
    const name = person.name;

    name.set('first', 'Cercei');

    assert.ok(name.hasDirtyAttributes, 'fragment is dirty');
    assert.ok(person.hasDirtyAttributes, 'owner record is dirty');
  });

  test('setting a fragment property to an object literal dirties the fragment and owner record', async function (assert) {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          name: {
            first: 'Visenya',
            last: 'Targaryen',
          },
        },
      },
    });

    const person = await store.findRecord('person', 1);
    const name = person.name;

    person.set('name', {
      first: 'Rhaenys',
    });

    assert.ok(name.hasDirtyAttributes, 'fragment is dirty');
    assert.ok(person.hasDirtyAttributes, 'owner record is dirty');
  });

  test('setting a fragment property with an object literal to the same value does not dirty the fragment or owner record', async function (assert) {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          name: {
            first: 'Samwell',
            last: 'Tarly',
          },
        },
      },
    });

    const person = await store.findRecord('person', 1);
    const name = person.name;

    person.set('name', {
      first: 'Samwell',
      last: 'Tarly',
    });

    assert.ok(!name.hasDirtyAttributes, 'fragment is clean');
    assert.ok(!person.hasDirtyAttributes, 'owner record is clean');
  });

  test('restoring a fragment property to its original state returns the fragment and owner record to a clean state', async function (assert) {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          name: {
            first: 'Hoster',
            last: 'Tully',
          },
        },
      },
    });

    const person = await store.findRecord('person', 1);
    const name = person.name;

    name.set('first', 'Brynden');
    name.set('first', 'Hoster');

    assert.ok(!name.hasDirtyAttributes, 'fragment is clean');
    assert.ok(!person.hasDirtyAttributes, 'owner record is clean');
  });

  test("restoring a fragment property to its original state when the owner record was dirty returns the fragment to a clean state maintains the owner record's dirty state", async function (assert) {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          name: {
            first: 'Jorah',
            last: 'Mormont',
          },
        },
      },
    });

    const person = await store.findRecord('person', 1);
    const name = person.name;

    // Dirty the owner record
    person.set('title', 'Lord Commander');

    name.set('first', 'Jeor');
    name.set('first', 'Jorah');

    assert.ok(!name.hasDirtyAttributes, 'fragment is clean');
    assert.ok(person.hasDirtyAttributes, 'owner record is still dirty');
  });

  test('rolling back the owner record returns fragment and owner record to a clean state', async function (assert) {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          name: {
            first: 'Catelyn',
            last: 'Stark',
          },
        },
      },
    });

    const person = await store.findRecord('person', 1);
    const name = person.name;

    name.set('last', 'Tully');

    person.rollbackAttributes();

    assert.ok(!name.hasDirtyAttributes, 'fragment is clean');
    assert.ok(!person.hasDirtyAttributes, 'owner record is clean');
  });

  test('a record can be rolled back multiple times', async function (assert) {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          name: {
            first: 'Arya',
            last: 'Stark',
          },
        },
      },
    });

    const person = await store.findRecord('person', 1);
    const name = person.name;

    name.set('last', '');
    person.rollbackAttributes();

    assert.equal(name.last, 'Stark', 'fragment has correct values');
    assert.ok(!name.hasDirtyAttributes, 'fragment is clean');
    assert.ok(!person.hasDirtyAttributes, 'owner record is clean');

    name.set('last', '');
    person.rollbackAttributes();

    assert.equal(name.last, 'Stark', 'fragment has correct values');
    assert.ok(!name.hasDirtyAttributes, 'fragment is clean');
    assert.ok(!person.hasDirtyAttributes, 'owner record is clean');
  });

  test('rolling back a fragment returns the fragment and the owner record to a clean state', async function (assert) {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          name: {
            first: 'Sansa',
            last: 'Stark',
          },
        },
      },
    });

    const person = await store.findRecord('person', 1);
    const name = person.name;

    // Dirty the fragment
    name.set('last', 'Lannister');

    name.rollbackAttributes();

    assert.ok(!name.hasDirtyAttributes, 'fragment is clean');
    assert.ok(!person.hasDirtyAttributes, 'owner record is clean');
  });

  test("changing a fragment property then rolling back the owner record preserves the fragment's owner", async function (assert) {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          name: {
            first: 'Arya',
            last: 'Stark',
          },
        },
      },
    });

    const person = await store.findRecord('person', 1);
    const name = person.name;

    person.set('name', null);

    person.rollbackAttributes();

    assert.equal(name.person, person, 'fragment owner is preserved');
  });

  test("rolling back a fragment when the owner record is dirty returns the fragment to a clean state and maintains the owner record's dirty state", async function (assert) {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          name: {
            first: 'Sansa',
            last: 'Stark',
          },
        },
      },
    });

    const person = await store.findRecord('person', 1);
    const name = person.name;

    // Dirty the owner record and fragment
    person.set('title', 'Heir to Winterfell');
    name.set('last', 'Lannister');

    name.rollbackAttributes();

    assert.ok(!name.hasDirtyAttributes, 'fragment is clean');
    assert.ok(person.hasDirtyAttributes, 'owner record is still dirty');
  });

  test('a fragment property that is set to null can be rolled back', async function (assert) {
    pushPerson(1);

    const person = await store.findRecord('person', 1);
    const name = person.name;

    person.set('name', null);

    assert.ok(person.hasDirtyAttributes, 'owner record is dirty');

    // Settings to the same value should still mark the record as dirty
    person.set('name', null);
    assert.ok(person.hasDirtyAttributes, 'owner record is still dirty');

    person.rollbackAttributes();

    assert.deepEqual(person.name, name, 'property is restored');
    assert.ok(!name.hasDirtyAttributes, 'fragment is clean');
    assert.ok(!person.hasDirtyAttributes, 'owner record is clean');
  });

  test('a fragment property that is null can be rolled back', async function (assert) {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {},
      },
    });

    const person = await store.findRecord('person', 1);
    const name = person.name;

    assert.equal(name, undefined, 'property is null');

    person.set(
      'name',
      store.createFragment('name', { first: 'Rob', last: 'Stark' }),
    );

    assert.ok(person.hasDirtyAttributes, 'owner record is dirty');

    person.rollbackAttributes();

    assert.equal(person.name, null, 'property is null again');
    assert.ok(!person.hasDirtyAttributes, 'owner record is clean');
  });

  test('changing a fragment array property with object literals dirties the fragment and owner record', async function (assert) {
    pushPerson(1);

    const person = await store.findRecord('person', 1);
    const addresses = person.addresses;

    person.set('addresses', [
      {
        street: '1 Sky Cell',
        city: 'Eyre',
        region: 'Vale of Arryn',
        country: 'Westeros',
      },
      {
        street: '1 Dungeon Cell',
        city: "King's Landing",
        region: 'Crownlands',
        country: 'Westeros',
      },
    ]);

    assert.ok(addresses.hasDirtyAttributes, 'fragment array is dirty');
    assert.ok(person.hasDirtyAttributes, 'owner record is dirty');
  });

  test('adding to a fragment array property with object literals dirties the fragment and owner record', async function (assert) {
    pushPerson(1);

    const person = await store.findRecord('person', 1);
    const addresses = person.addresses;

    addresses.pushObject({
      street: '1 Dungeon Cell',
      city: "King's Landing",
      region: 'Crownlands',
      country: 'Westeros',
    });

    assert.ok(addresses.hasDirtyAttributes, 'fragment array is dirty');
    assert.ok(person.hasDirtyAttributes, 'owner record is dirty');
  });

  test('setting a fragment property with object literals to the same values does not dirty the fragment or owner record', async function (assert) {
    pushPerson(1);

    const person = await store.findRecord('person', 1);
    const addresses = person.addresses;

    person.set('addresses', people[0].addresses);

    assert.ok(!addresses.hasDirtyAttributes, 'fragment is clean');
    assert.ok(!person.hasDirtyAttributes, 'owner record is clean');
  });

  test('adding a fragment to a fragment array dirties the fragment array and owner record', async function (assert) {
    pushPerson(1);

    const person = await store.findRecord('person', 1);
    const addresses = person.addresses;

    addresses.createFragment({
      street: '1 Dungeon Cell',
      city: "King's Landing",
      region: 'Crownlands',
      country: 'Westeros',
    });

    assert.ok(addresses.hasDirtyAttributes, 'fragment array is dirty');
    assert.ok(person.hasDirtyAttributes, 'owner record is dirty');
  });

  test('removing a fragment from a fragment array dirties the fragment array and owner record', async function (assert) {
    pushPerson(1);

    const person = await store.findRecord('person', 1);
    const addresses = person.addresses;

    addresses.removeObject(addresses[0]);

    assert.ok(addresses.hasDirtyAttributes, 'fragment array is dirty');
    assert.ok(person.hasDirtyAttributes, 'owner record is dirty');
  });

  test('reordering a fragment array dirties the fragment array and owner record', async function (assert) {
    pushPerson(1);

    const person = await store.findRecord('person', 1);
    const addresses = person.addresses;
    const length = addresses.length;

    const address = addresses.popObject();
    addresses.unshiftObject(address);

    assert.equal(
      addresses.length,
      length,
      'fragment array length is maintained',
    );
    assert.ok(addresses.hasDirtyAttributes, 'fragment array is dirty');
    assert.ok(person.hasDirtyAttributes, 'owner record is dirty');
  });

  test('restoring a fragment array to its original order returns the fragment array owner record to a clean state', async function (assert) {
    pushPerson(1);

    const person = await store.findRecord('person', 1);
    const addresses = person.addresses;

    const address = addresses.popObject();
    addresses.pushObject(address);

    assert.ok(!addresses.hasDirtyAttributes, 'fragment array is clean');
    assert.ok(!person.hasDirtyAttributes, 'owner record is clean');
  });

  test("restoring a fragment array to its original order when the owner record was dirty returns the fragment array to a clean state and maintains the owner record's dirty state", async function (assert) {
    pushPerson(1);

    const person = await store.findRecord('person', 1);
    const addresses = person.addresses;

    // Dirty the owner record
    person.set('title', 'Hand of the King');

    const address = addresses.popObject();
    addresses.pushObject(address);

    assert.ok(!addresses.hasDirtyAttributes, 'fragment array is clean');
    assert.ok(person.hasDirtyAttributes, 'owner record is still dirty');
  });

  test('restoring a primitive array to its original order returns the array owner record to a clean state', async function (assert) {
    pushPerson(1);

    const person = await store.findRecord('person', 1);
    const titles = person.titles;
    assert.ok(!titles.hasDirtyAttributes, 'primitive array is clean');
    assert.ok(!person.hasDirtyAttributes, 'owner record is clean');

    const title = titles.popObject();
    assert.ok(titles.hasDirtyAttributes, 'primitive array is dirty');
    assert.ok(person.hasDirtyAttributes, 'owner record is dirty');

    titles.pushObject(title);
    assert.ok(!titles.hasDirtyAttributes, 'primitive array is clean');
    assert.ok(!person.hasDirtyAttributes, 'owner record is clean');
  });

  test('restoring a primitive array after setting to null returns the array owner record to a clean state', async function (assert) {
    pushPerson(1);

    const person = await store.findRecord('person', 1);
    const titles = person.titles;
    assert.ok(!titles.hasDirtyAttributes, 'primitive array is clean');
    assert.ok(!person.hasDirtyAttributes, 'owner record is clean');

    person.set('titles', null);
    assert.ok(titles.hasDirtyAttributes, 'primitive array is dirty');
    assert.ok(person.hasDirtyAttributes, 'owner record is dirty');

    person.set('titles', titles);
    assert.ok(!titles.hasDirtyAttributes, 'primitive array is clean');
    assert.ok(!person.hasDirtyAttributes, 'owner record is clean');
  });

  test('changing a fragment property in a fragment array dirties the fragment, fragment array, and owner record', async function (assert) {
    pushPerson(1);

    const person = await store.findRecord('person', 1);
    const addresses = person.addresses;
    const address = addresses[0];

    assert.false(address.hasDirtyAttributes, 'fragment is clean');
    assert.false(addresses.hasDirtyAttributes, 'fragment array is clean');
    assert.false(person.hasDirtyAttributes, 'owner record is clean');

    address.set('street', '2 Sky Cell');

    assert.ok(address.hasDirtyAttributes, 'fragment is dirty');
    assert.ok(addresses.hasDirtyAttributes, 'fragment array is dirty');
    assert.ok(person.hasDirtyAttributes, 'owner record is dirty');
  });

  test('restoring a fragment in a fragment array property to its original state returns the fragment, fragment array, and owner record to a clean state', async function (assert) {
    pushPerson(1);

    const person = await store.findRecord('person', 1);
    const addresses = person.addresses;
    const address = addresses[0];

    address.set('street', '2 Sky Cell');
    address.set('street', '1 Sky Cell');

    assert.ok(!address.hasDirtyAttributes, 'fragment is clean');
    assert.ok(!addresses.hasDirtyAttributes, 'fragment array is clean');
    assert.ok(!person.hasDirtyAttributes, 'owner record is clean');
  });

  test("restoring a fragment in a fragment array property to its original state when the fragment array was dirty returns the fragment to a clean state and maintains the fragment array and owner record's dirty state", async function (assert) {
    pushPerson(1);

    const person = await store.findRecord('person', 1);
    const addresses = person.addresses;
    const address = addresses.firstObject;

    // Dirty the record array
    addresses.popObject();

    address.set('street', '2 Sky Cell');
    address.set('street', '1 Sky Cell');

    assert.ok(!address.hasDirtyAttributes, 'fragment is clean');
    assert.ok(addresses.hasDirtyAttributes, 'fragment array is still dirty');
    assert.ok(person.hasDirtyAttributes, 'owner record is dirty');
  });

  test("restoring a fragment in a fragment array property to its original state when the owner record was dirty returns the fragment and fragment array to a clean state maintains the owner record's dirty state", async function (assert) {
    pushPerson(1);

    const person = await store.findRecord('person', 1);
    const addresses = person.addresses;
    const address = addresses.firstObject;

    address.set('street', '2 Sky Cell');
    address.set('street', '1 Sky Cell');

    // Dirty the owner record
    person.set('title', 'Master of Coin');

    assert.ok(!address.hasDirtyAttributes, 'fragment is clean');
    assert.ok(!addresses.hasDirtyAttributes, 'fragment array is clean');
    assert.ok(person.hasDirtyAttributes, 'owner record is still dirty');
  });

  test('rolling back the owner record returns all fragments in a fragment array property, the fragment array, and owner record to a clean state', async function (assert) {
    pushPerson(1);

    const person = await store.findRecord('person', 1);
    const addresses = person.addresses;
    const address = addresses.firstObject;

    // Dirty the owner record, fragment array, and a fragment
    person.set('title', 'Warden of the West');
    addresses.popObject();
    address.set('street', '2 Sky Cell');

    person.rollbackAttributes();

    assert.ok(!address.hasDirtyAttributes, 'fragment is clean');
    assert.ok(!addresses.hasDirtyAttributes, 'fragment array is clean');
    assert.ok(!person.hasDirtyAttributes, 'owner record is clean');
  });

  test('rolling back the owner record returns all values in an array property, the array, and the owner record to a clean state', async function (assert) {
    pushPerson(1);

    const person = await store.findRecord('person', 1);
    const titles = person.titles;
    const values = titles.toArray();

    // Dirty the primitive array
    titles.popObject();
    titles.unshiftObject('Giant of Lannister');

    person.rollbackAttributes();

    assert.deepEqual(
      values,
      person.titles.toArray(),
      'primitive values are reset',
    );
    assert.ok(!titles.hasDirtyAttributes, 'fragment array is clean');
    assert.ok(!person.hasDirtyAttributes, 'owner record is clean');
  });

  test('rolling back an array returns the array to a clean state', async function (assert) {
    pushPerson(1);

    const person = await store.findRecord('person', 1);
    const titles = person.titles;
    const values = titles.toArray();

    // Dirty the owner record and the primitive array
    person.set('title', 'Warden of the West');
    assert.ok(person.hasDirtyAttributes, 'owner record is dirty');

    titles.popObject();
    titles.unshiftObject('Giant of Lannister');
    assert.ok(titles.hasDirtyAttributes, 'primitive array is dirty');

    titles.rollbackAttributes();

    assert.deepEqual(
      values,
      person.titles.toArray(),
      'primitive values are reset',
    );
    assert.ok(!titles.hasDirtyAttributes, 'primitive array is clean');
    assert.ok(person.hasDirtyAttributes, 'owner record is still dirty');

    person.rollbackAttributes();
    assert.ok(!person.hasDirtyAttributes, 'owner record is clean');
  });

  test('rolling back a fragment array returns all fragments, the fragment array, and the owner record to a clean state', async function (assert) {
    pushPerson(1);

    const person = await store.findRecord('person', 1);
    const addresses = person.addresses;
    const address = addresses.firstObject;

    // Dirty the fragment array and a fragment
    addresses.popObject();
    address.set('street', '2 Sky Cell');

    addresses.rollbackAttributes();

    assert.ok(!address.hasDirtyAttributes, 'fragment is clean');
    assert.ok(!addresses.hasDirtyAttributes, 'fragment array is clean');
    assert.ok(!person.hasDirtyAttributes, 'owner record is clean');
  });

  test('rolling back a nested fragment array returns both fragment arrays and the owner record to a clean state', async function (assert) {
    store.push({
      data: {
        type: 'user',
        id: 1,
        attributes: {
          orders: [
            {
              amount: '799.98',
              products: [
                {
                  name: 'Tears of Lys',
                  sku: 'poison-bd-32',
                  price: '499.99',
                },
                {
                  name: 'The Strangler',
                  sku: 'poison-md-24',
                  price: '299.99',
                },
              ],
            },
          ],
        },
      },
    });

    const user = await store.findRecord('user', 1);
    const orders = user.orders;
    const products = orders[0].products;

    assert.ok(!products.hasDirtyAttributes, 'inner fragment array is clean');
    assert.ok(!orders.hasDirtyAttributes, 'outer fragment array is clean');
    assert.ok(!user.hasDirtyAttributes, 'owner record is clean');

    products.popObject();

    assert.ok(products.hasDirtyAttributes, 'inner fragment array is dirty');
    assert.ok(orders.hasDirtyAttributes, 'outer fragment array is dirty');
    assert.ok(user.hasDirtyAttributes, 'owner record is dirty');

    products.rollbackAttributes();

    assert.ok(!products.hasDirtyAttributes, 'inner fragment array is clean');
    assert.ok(!orders.hasDirtyAttributes, 'outer fragment array is clean');
    assert.ok(!user.hasDirtyAttributes, 'owner record is clean');
  });

  test("rolling back a fragment array when the owner record is dirty returns all fragments and the fragment array to a clean state and retains the owner record's dirty state", async function (assert) {
    pushPerson(1);

    const person = await store.findRecord('person', 1);
    const addresses = person.addresses;
    const address = addresses.firstObject;

    // Dirty the owner record, fragment array, and a fragment
    person.set('title', 'Lord of the Westerlands');
    addresses.popObject();
    address.set('street', '2 Sky Cell');

    addresses.rollbackAttributes();

    assert.ok(!address.hasDirtyAttributes, 'fragment is clean');
    assert.ok(!addresses.hasDirtyAttributes, 'fragment array is clean');
    assert.ok(person.hasDirtyAttributes, 'owner record is still dirty');
  });

  test('rolling back a fragment in a fragment array property returns the fragment, fragment array, and owner record to a clean states', async function (assert) {
    pushPerson(1);

    const person = await store.findRecord('person', 1);
    const addresses = person.addresses;
    const address = addresses.firstObject;

    // Dirty a fragment
    address.set('street', '2 Sky Cell');

    address.rollbackAttributes();

    assert.ok(!address.hasDirtyAttributes, 'fragment is clean');
    assert.ok(!addresses.hasDirtyAttributes, 'fragment array is clean');
    assert.ok(!person.hasDirtyAttributes, 'owner record is clean');
  });

  test("rolling back a fragment in a fragment array property when the fragment array is dirty returns the fragment to a clean state and maintains the fragment array and owner record's dirty state", async function (assert) {
    pushPerson(1);

    const person = await store.findRecord('person', 1);
    const addresses = person.addresses;
    const address = addresses.firstObject;

    // Dirty fragment array, and a fragment
    addresses.popObject();
    address.set('street', '2 Sky Cell');

    address.rollbackAttributes();

    assert.ok(!address.hasDirtyAttributes, 'fragment is clean');
    assert.ok(addresses.hasDirtyAttributes, 'fragment array is still dirty');
    assert.ok(person.hasDirtyAttributes, 'owner record is still dirty');
  });

  test("rolling back a fragment in a fragment array property when the owner record is dirty returns the fragment and fragment array to a clean state and maintains the owner record's dirty state", async function (assert) {
    pushPerson(1);

    const person = await store.findRecord('person', 1);
    const addresses = person.addresses;
    const address = addresses.firstObject;

    // Dirty the owner record, and a fragment
    person.set('title', 'Lord of Casterly Rock');
    address.set('street', '2 Sky Cell');

    address.rollbackAttributes();

    assert.ok(!address.hasDirtyAttributes, 'fragment is clean');
    assert.ok(!addresses.hasDirtyAttributes, 'fragment array is clean');
    assert.ok(person.hasDirtyAttributes, 'owner record is still dirty');
  });

  test('a fragment array property that is set to null can be rolled back', async function (assert) {
    pushPerson(1);

    const person = await store.findRecord('person', 1);
    const addresses = person.addresses;

    person.set('addresses', null);

    assert.ok(person.hasDirtyAttributes, 'owner record is dirty');

    person.rollbackAttributes();

    assert.equal(person.addresses, addresses, 'property is restored');
    assert.ok(!addresses.hasDirtyAttributes, 'fragment array is clean');
    assert.ok(!person.hasDirtyAttributes, 'owner record is clean');
  });

  test('a fragment array property that is null can be rolled back', async function (assert) {
    pushPerson(1);

    const person = await store.findRecord('person', 1);
    const hobbies = person.hobbies;

    assert.equal(hobbies, null, 'property is null');

    person.set('hobbies', [
      store.createFragment('hobby', {
        name: 'guitar',
      }),
    ]);

    assert.ok(person.hasDirtyAttributes, 'owner record is dirty');

    person.rollbackAttributes();

    assert.equal(person.hobbies, null, 'property is null again');
    assert.ok(!person.hasDirtyAttributes, 'owner record is clean');
  });

  test('a fragment array property that is empty can be rolled back', async function (assert) {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {},
      },
    });

    const person = await store.findRecord('person', 1);
    const addresses = person.addresses;

    assert.ok(
      isArray(addresses) && isEmpty(addresses),
      'property is an empty array',
    );

    person.set('addresses', [
      store.createFragment('address', {
        street: '1 Spear Tower',
        city: 'Sun Spear',
        region: 'Dorne',
        country: 'Westeros',
      }),
    ]);

    assert.ok(person.hasDirtyAttributes, 'owner record is dirty');

    person.rollbackAttributes();

    assert.ok(
      isArray(person.addresses) && isEmpty(person.addresses),
      'property is an empty array again',
    );
    assert.ok(!person.hasDirtyAttributes, 'owner record is clean');
  });

  test("pushing a fragment update doesn't cause it to become dirty", async function (assert) {
    pushPerson(1);

    const person = await store.findRecord('person', 1);
    assert.ok(!person.hasDirtyAttributes, 'person record is not dirty');

    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          name: { first: 'Jamie' },
        },
      },
    });

    assert.equal(person.name.first, 'Jamie', 'first name updated');
    assert.equal(person.name.last, 'Lannister', 'last name is the same');
    assert.ok(!person.hasDirtyAttributes, 'person record is not dirty');
  });

  test('pushing a fragment array update doesnt cause it to become dirty', async function (assert) {
    pushPerson(1);

    const person = await store.findRecord('person', 1);
    assert.ok(!person.hasDirtyAttributes, 'person record is not dirty');

    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          addresses: [
            // Yeah, this is pretty weird...
            {},
            {
              street: '1 Dungeon Cell',
            },
          ],
        },
      },
    });

    assert.equal(
      person.addresses[person.addresses.length - 1].street,
      '1 Dungeon Cell',
      'street updated',
    );
    assert.equal(
      person.addresses[person.addresses.length - 1].city,
      "King's Landing",
      'city is the same',
    );
    assert.ok(!person.hasDirtyAttributes, 'person record is not dirty');
  });

  test('updating a fragment and a property then resetting the property', async function (assert) {
    pushPerson(1);

    const person = await store.findRecord('person', 1);
    assert.ok(!person.hasDirtyAttributes, 'person record is not dirty');

    person.name.set('first', 'Another firstname');
    assert.ok(person.hasDirtyAttributes, 'person record is dirty');

    const oldTitle = person.title;
    person.set('title', 'New title');
    assert.ok(person.hasDirtyAttributes, 'person record is dirty');

    person.set('title', oldTitle);
    assert.ok(person.name.hasDirtyAttributes, 'fragment name is dirty');
    assert.ok(person.hasDirtyAttributes, 'person record is dirty');
  });
});
