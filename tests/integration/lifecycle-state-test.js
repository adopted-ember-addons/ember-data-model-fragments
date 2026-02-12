import { module, test } from 'qunit';
import { setupApplicationTest } from '../helpers';
import { copy } from 'ember-data-model-fragments/util/copy';
import Pretender from 'pretender';

let store, owner, server;

module('integration - Lifecycle State', function (hooks) {
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

  // ---- isNew state ----

  module('isNew state', function () {
    test('createFragment produces a new fragment', function (assert) {
      const person = store.createRecord('person');
      person.set(
        'name',
        store.createFragment('name', {
          first: 'Aegon',
          last: 'Targaryen',
        }),
      );

      const name = person.name;

      assert.ok(name.isNew, 'created fragment is new');
      assert.ok(!name.isDeleted, 'created fragment is not deleted');
      assert.ok(
        name.hasDirtyAttributes,
        'created fragment has dirty attributes',
      );
    });

    test('store.push produces a non-new fragment', async function (assert) {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            name: {
              first: 'Tyrion',
              last: 'Lannister',
            },
          },
        },
      });

      const person = await store.findRecord('person', 1);
      const name = person.name;

      assert.ok(!name.isNew, 'pushed fragment is not new');
      assert.ok(!name.isDeleted, 'pushed fragment is not deleted');
      assert.ok(!name.hasDirtyAttributes, 'pushed fragment is clean');
    });

    test('store.push array items are not new', async function (assert) {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
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

      const person = await store.findRecord('person', 1);
      const address = person.addresses.firstObject;

      assert.ok(!address.isNew, 'pushed fragment array item is not new');
      assert.ok(
        !address.isDeleted,
        'pushed fragment array item is not deleted',
      );
      assert.ok(
        !address.hasDirtyAttributes,
        'pushed fragment array item is clean',
      );
    });

    test('fragment array items transition from new to not-new after save', async function (assert) {
      const person = store.createRecord('person');
      const address = store.createFragment('address', {
        street: '1 Stone Drum',
        city: 'Dragonstone',
        region: 'Crownlands',
        country: 'Westeros',
      });
      person.set('addresses', [address]);

      assert.ok(address.isNew, 'fragment array item is new before save');
      assert.ok(
        !address.isDeleted,
        'fragment array item is not deleted before save',
      );

      server.post('/people', () => {
        return [
          200,
          { 'Content-Type': 'application/json' },
          JSON.stringify({
            person: {
              id: 3,
              addresses: [
                {
                  street: '1 Stone Drum',
                  city: 'Dragonstone',
                  region: 'Crownlands',
                  country: 'Westeros',
                },
              ],
            },
          }),
        ];
      });

      await person.save();

      assert.ok(!address.isNew, 'fragment array item is not new after save');
      assert.ok(
        !address.isDeleted,
        'fragment array item is not deleted after save',
      );
      assert.ok(
        !address.hasDirtyAttributes,
        'fragment array item is clean after save',
      );
    });
  });

  // ---- isDeleted state ----

  module('isDeleted state', function () {
    test('fragment is not deleted after saving an existing record', async function (assert) {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            name: { first: 'Eddard', last: 'Stark' },
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

      const person = await store.findRecord('person', 1);

      person.name.set('first', 'Ned');
      await person.save();

      const name = person.name;
      const address = person.addresses.firstObject;

      assert.ok(!name.isNew, 'fragment is not new after save');
      assert.ok(!name.isDeleted, 'fragment is not deleted after save');
      assert.ok(!name.hasDirtyAttributes, 'fragment is clean after save');

      assert.ok(!address.isNew, 'fragment array item is not new');
      assert.ok(!address.isDeleted, 'fragment array item is not deleted');
      assert.ok(!address.hasDirtyAttributes, 'fragment array item is clean');
    });

    test('fragment removed from array is not deleted', async function (assert) {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
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
        },
      });

      const person = await store.findRecord('person', 1);
      const addresses = person.addresses;
      const removedAddress = addresses.firstObject;

      addresses.removeObject(removedAddress);

      assert.ok(!removedAddress.isDeleted, 'removed fragment is not deleted');
      assert.ok(
        !removedAddress.isDestroying,
        'removed fragment is not destroying',
      );
    });

    test('server setting fragment to null does not mark owner as deleted', async function (assert) {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            name: { first: 'Eddard', last: 'Stark' },
          },
        },
      });

      server.put('/people/1', () => {
        return [
          200,
          { 'Content-Type': 'application/json' },
          JSON.stringify({ person: { id: 1, name: null } }),
        ];
      });

      const person = await store.findRecord('person', 1);
      await person.save();

      assert.equal(person.name, null, 'fragment is null after server response');
      assert.ok(!person.isDeleted, 'owner record is not deleted');
      assert.ok(!person.hasDirtyAttributes, 'owner record is clean');
    });

    test('fragment is not deleted after 204 No Content save', async function (assert) {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            name: { first: 'Stannis', last: 'Baratheon' },
            addresses: [
              {
                street: '1 Stone Drum',
                city: 'Dragonstone',
                region: 'Crownlands',
                country: 'Westeros',
              },
            ],
          },
        },
      });

      server.put('/people/1', () => [204]);

      const person = await store.findRecord('person', 1);

      person.name.set('first', 'King Stannis');
      await person.save();

      const name = person.name;
      const address = person.addresses.firstObject;

      assert.ok(!name.isNew, 'fragment is not new after save');
      assert.ok(!name.isDeleted, 'fragment is not deleted after 204 save');
      assert.ok(!name.hasDirtyAttributes, 'fragment is clean after save');

      assert.ok(!address.isNew, 'fragment array item is not new');
      assert.ok(
        !address.isDeleted,
        'fragment array item is not deleted after 204 save',
      );
      assert.ok(!address.hasDirtyAttributes, 'fragment array item is clean');
    });
  });

  // ---- Fragment array item lifecycle ----

  module('fragment array item lifecycle', function () {
    test('server returns fewer items than sent', async function (assert) {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            addresses: [
              {
                street: '1 Great Keep',
                city: 'Winterfell',
                region: 'North',
                country: 'Westeros',
              },
              {
                street: '1 Red Keep',
                city: "King's Landing",
                region: 'Crownlands',
                country: 'Westeros',
              },
            ],
          },
        },
      });

      server.put('/people/1', () => {
        return [
          200,
          { 'Content-Type': 'application/json' },
          JSON.stringify({
            person: {
              id: 1,
              addresses: [
                {
                  street: '1 Great Keep',
                  city: 'Winterfell',
                  region: 'North',
                  country: 'Westeros',
                },
              ],
            },
          }),
        ];
      });

      const person = await store.findRecord('person', 1);
      await person.save();

      const addresses = person.addresses;

      assert.equal(addresses.length, 1, 'array has correct number of items');
      assert.ok(
        !addresses.firstObject.isDeleted,
        'remaining item is not deleted',
      );
      assert.ok(
        !addresses.firstObject.hasDirtyAttributes,
        'remaining item is clean',
      );
      assert.ok(!person.hasDirtyAttributes, 'owner record is clean');
    });

    test('server returns more items than sent', async function (assert) {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
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
        return [
          200,
          { 'Content-Type': 'application/json' },
          JSON.stringify({
            person: {
              id: 1,
              addresses: [
                {
                  street: '1 Great Keep',
                  city: 'Winterfell',
                  region: 'North',
                  country: 'Westeros',
                },
                {
                  street: '1 Red Keep',
                  city: "King's Landing",
                  region: 'Crownlands',
                  country: 'Westeros',
                },
              ],
            },
          }),
        ];
      });

      const person = await store.findRecord('person', 1);
      await person.save();

      const addresses = person.addresses;

      assert.equal(addresses.length, 2, 'array has correct number of items');
      assert.ok(!addresses.isAny('isNew'), 'no items are new');
      assert.ok(!addresses.isAny('isDeleted'), 'no items are deleted');
      assert.ok(!addresses.isAny('hasDirtyAttributes'), 'all items are clean');
      assert.ok(!person.hasDirtyAttributes, 'owner record is clean');
    });
  });

  // ---- Nested fragment lifecycle ----

  module('nested fragment lifecycle', function () {
    test('nested fragments are all clean after saving a new record', async function (assert) {
      const data = {
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
      };

      const user = store.createRecord('user', data);

      server.post('/users', () => {
        const payload = { user: copy(data, true) };
        payload.user.id = 1;
        return [
          200,
          { 'Content-Type': 'application/json' },
          JSON.stringify(payload),
        ];
      });

      await user.save();

      const orders = user.orders;
      const order = orders.firstObject;
      const products = order.products;

      assert.ok(!user.hasDirtyAttributes, 'owner record is clean');
      assert.ok(!user.isDeleted, 'owner record is not deleted');

      assert.ok(!orders.hasDirtyAttributes, 'orders array is clean');
      assert.ok(!orders.isAny('isNew'), 'orders are not new');
      assert.ok(!orders.isAny('isDeleted'), 'orders are not deleted');
      assert.ok(!orders.isAny('hasDirtyAttributes'), 'all orders are clean');

      assert.ok(!products.hasDirtyAttributes, 'products array is clean');
      assert.ok(!products.isAny('isNew'), 'products are not new');
      assert.ok(!products.isAny('isDeleted'), 'products are not deleted');
      assert.ok(
        !products.isAny('hasDirtyAttributes'),
        'all products are clean',
      );
    });

    test('nested fragments are all clean after saving an existing record', async function (assert) {
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
                ],
              },
            ],
          },
        },
      });

      server.put('/users/1', () => {
        return [200, { 'Content-Type': 'application/json' }, '{}'];
      });

      const user = await store.findRecord('user', 1);

      user.orders.firstObject.products.firstObject.set('price', '599.99');
      await user.save();

      const order = user.orders.firstObject;
      const product = order.products.firstObject;

      assert.ok(!user.hasDirtyAttributes, 'owner record is clean');

      assert.ok(!order.isNew, 'order is not new');
      assert.ok(!order.isDeleted, 'order is not deleted');
      assert.ok(!order.hasDirtyAttributes, 'order is clean');

      assert.ok(!product.isNew, 'product is not new');
      assert.ok(!product.isDeleted, 'product is not deleted');
      assert.ok(!product.hasDirtyAttributes, 'product is clean');
    });

    test('deeply nested fragment lifecycle (vehicle -> passenger -> name)', async function (assert) {
      const data = {
        passenger: {
          name: { first: 'Hodor', last: '' },
        },
      };

      const vehicle = store.createRecord('vehicle', data);

      server.post('/vehicles', () => {
        const payload = { vehicle: copy(data, true) };
        payload.vehicle.id = 1;
        return [
          200,
          { 'Content-Type': 'application/json' },
          JSON.stringify(payload),
        ];
      });

      const passenger = vehicle.passenger;
      const name = passenger.name;

      assert.ok(passenger.isNew, 'passenger is new before save');
      assert.ok(name.isNew, 'name is new before save');

      await vehicle.save();

      assert.ok(!vehicle.hasDirtyAttributes, 'vehicle is clean');

      assert.ok(!passenger.isNew, 'passenger is not new after save');
      assert.ok(!passenger.isDeleted, 'passenger is not deleted after save');
      assert.ok(!passenger.hasDirtyAttributes, 'passenger is clean after save');

      assert.ok(!name.isNew, 'name is not new after save');
      assert.ok(!name.isDeleted, 'name is not deleted after save');
      assert.ok(!name.hasDirtyAttributes, 'name is clean after save');
    });
  });

  // ---- Multiple save cycles ----

  module('multiple save cycles', function () {
    test('create -> save -> modify -> save', async function (assert) {
      const person = store.createRecord('person');
      person.set(
        'name',
        store.createFragment('name', {
          first: 'Robb',
          last: 'Stark',
        }),
      );

      server.post('/people', () => {
        return [
          200,
          { 'Content-Type': 'application/json' },
          JSON.stringify({
            person: {
              id: 5,
              name: { first: 'Robb', last: 'Stark' },
            },
          }),
        ];
      });

      await person.save();

      const name = person.name;

      assert.ok(!name.isNew, 'fragment is not new after first save');
      assert.ok(!name.isDeleted, 'fragment is not deleted after first save');
      assert.ok(!name.hasDirtyAttributes, 'fragment is clean after first save');

      name.set('first', 'King Robb');

      assert.ok(
        name.hasDirtyAttributes,
        'fragment is dirty after modification',
      );

      server.put('/people/5', () => {
        return [200, { 'Content-Type': 'application/json' }, '{}'];
      });

      await person.save();

      assert.ok(!name.isNew, 'fragment is not new after second save');
      assert.ok(!name.isDeleted, 'fragment is not deleted after second save');
      assert.ok(
        !name.hasDirtyAttributes,
        'fragment is clean after second save',
      );
      assert.ok(
        !person.hasDirtyAttributes,
        'owner record is clean after second save',
      );
    });

    test('push -> modify -> save -> modify -> save', async function (assert) {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            name: { first: 'Jaime', last: 'Lannister' },
          },
        },
      });

      server.put('/people/1', () => {
        return [200, { 'Content-Type': 'application/json' }, '{}'];
      });

      const person = await store.findRecord('person', 1);
      const name = person.name;

      name.set('first', 'Kingslayer');
      await person.save();

      assert.ok(!name.isNew, 'fragment is not new after first save');
      assert.ok(!name.isDeleted, 'fragment is not deleted after first save');
      assert.ok(!name.hasDirtyAttributes, 'fragment is clean after first save');

      name.set('last', 'Goldenhand');
      await person.save();

      assert.ok(!name.isNew, 'fragment is not new after second save');
      assert.ok(!name.isDeleted, 'fragment is not deleted after second save');
      assert.ok(
        !name.hasDirtyAttributes,
        'fragment is clean after second save',
      );
      assert.ok(
        !person.hasDirtyAttributes,
        'owner record is clean after second save',
      );
    });

    test('fragment array across multiple save cycles', async function (assert) {
      const person = store.createRecord('person');
      person.set('addresses', [
        {
          street: '1 Great Keep',
          city: 'Winterfell',
          region: 'North',
          country: 'Westeros',
        },
      ]);

      server.post('/people', () => {
        return [
          200,
          { 'Content-Type': 'application/json' },
          JSON.stringify({
            person: {
              id: 7,
              addresses: [
                {
                  street: '1 Great Keep',
                  city: 'Winterfell',
                  region: 'North',
                  country: 'Westeros',
                },
              ],
            },
          }),
        ];
      });

      await person.save();

      const addresses = person.addresses;

      assert.ok(
        !addresses.hasDirtyAttributes,
        'array is clean after first save',
      );
      assert.ok(
        !addresses.isAny('isDeleted'),
        'no items are deleted after first save',
      );

      addresses.createFragment({
        street: '1 Red Keep',
        city: "King's Landing",
        region: 'Crownlands',
        country: 'Westeros',
      });

      server.put('/people/7', () => {
        return [200, { 'Content-Type': 'application/json' }, '{}'];
      });

      await person.save();

      assert.equal(addresses.length, 2, 'array has correct length');
      assert.ok(
        !addresses.hasDirtyAttributes,
        'array is clean after second save',
      );
      assert.ok(
        !addresses.isAny('isNew'),
        'no items are new after second save',
      );
      assert.ok(
        !addresses.isAny('isDeleted'),
        'no items are deleted after second save',
      );
      assert.ok(
        !addresses.isAny('hasDirtyAttributes'),
        'all items are clean after second save',
      );
      assert.ok(!person.hasDirtyAttributes, 'owner record is clean');
    });
  });

  // ---- Owner deleteRecord ----

  module('owner deleteRecord', function () {
    test('deleteRecord does not independently mark fragments as deleted', async function (assert) {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            name: { first: 'Eddard', last: 'Stark' },
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

      const person = await store.findRecord('person', 1);
      const name = person.name;
      const address = person.addresses.firstObject;

      person.deleteRecord();

      assert.ok(person.isDeleted, 'owner record is deleted');
      assert.ok(!name.isDeleted, 'fragment is not independently deleted');
      assert.ok(
        !address.isDeleted,
        'fragment array item is not independently deleted',
      );
    });

    test('deleteRecord followed by save completes without error', async function (assert) {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            name: { first: 'Eddard', last: 'Stark' },
          },
        },
      });

      server.delete('/people/1', () => {
        return [204];
      });

      const person = await store.findRecord('person', 1);
      const name = person.name;

      assert.ok(!name.isDeleted, 'fragment is not deleted before deleteRecord');

      person.deleteRecord();

      assert.ok(person.isDeleted, 'owner record is marked for deletion');
      assert.ok(!name.isDeleted, 'fragment is not deleted');

      await person.save();

      assert.ok(person.isDeleted, 'owner record is still deleted after save');
    });

    test('rollbackAttributes after deleteRecord restores fragment state', async function (assert) {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            name: { first: 'Eddard', last: 'Stark' },
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

      const person = await store.findRecord('person', 1);
      const name = person.name;
      const address = person.addresses.firstObject;

      person.deleteRecord();

      assert.ok(person.isDeleted, 'owner record is deleted');

      person.rollbackAttributes();

      assert.ok(!person.isDeleted, 'owner is not deleted after rollback');
      assert.ok(!person.hasDirtyAttributes, 'owner is clean after rollback');

      assert.ok(!name.isNew, 'fragment is not new after rollback');
      assert.ok(!name.isDeleted, 'fragment is not deleted after rollback');
      assert.ok(!name.hasDirtyAttributes, 'fragment is clean after rollback');

      assert.ok(
        !address.isNew,
        'fragment array item is not new after rollback',
      );
      assert.ok(
        !address.isDeleted,
        'fragment array item is not deleted after rollback',
      );
      assert.ok(
        !address.hasDirtyAttributes,
        'fragment array item is clean after rollback',
      );
    });
  });

  // ---- Rollback and lifecycle state ----

  module('rollback and lifecycle state', function () {
    test('rollback new fragment set on existing record restores lifecycle state', async function (assert) {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            name: { first: 'Theon', last: 'Greyjoy' },
          },
        },
      });

      const person = await store.findRecord('person', 1);
      const originalName = person.name;

      person.set(
        'name',
        store.createFragment('name', {
          first: 'Reek',
          last: '',
        }),
      );

      assert.ok(person.hasDirtyAttributes, 'owner record is dirty');

      person.rollbackAttributes();

      assert.ok(
        !person.hasDirtyAttributes,
        'owner record is clean after rollback',
      );
      assert.ok(!originalName.isNew, 'original fragment is not new');
      assert.ok(!originalName.isDeleted, 'original fragment is not deleted');
      assert.ok(!originalName.hasDirtyAttributes, 'original fragment is clean');
      assert.equal(originalName.first, 'Theon', 'original value is restored');
    });

    test('rollback modified existing fragment restores lifecycle state', async function (assert) {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            name: { first: 'Bran', last: 'Stark' },
          },
        },
      });

      const person = await store.findRecord('person', 1);
      const name = person.name;

      name.set('first', 'Brandon');
      name.set('last', 'the Broken');

      assert.ok(name.hasDirtyAttributes, 'fragment is dirty');

      person.rollbackAttributes();

      assert.ok(!name.isNew, 'fragment is not new after rollback');
      assert.ok(!name.isDeleted, 'fragment is not deleted after rollback');
      assert.ok(!name.hasDirtyAttributes, 'fragment is clean after rollback');
      assert.equal(name.first, 'Bran', 'first name is restored');
      assert.equal(name.last, 'Stark', 'last name is restored');
    });

    test('rollback fragment array additions restores lifecycle state', async function (assert) {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
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

      const person = await store.findRecord('person', 1);
      const addresses = person.addresses;
      const originalAddress = addresses.firstObject;

      addresses.createFragment({
        street: '1 Red Keep',
        city: "King's Landing",
        region: 'Crownlands',
        country: 'Westeros',
      });

      assert.equal(addresses.length, 2, 'array has 2 items');

      person.rollbackAttributes();

      assert.equal(addresses.length, 1, 'array has 1 item after rollback');
      assert.ok(!originalAddress.isNew, 'original item is not new');
      assert.ok(!originalAddress.isDeleted, 'original item is not deleted');
      assert.ok(!originalAddress.hasDirtyAttributes, 'original item is clean');
      assert.ok(!addresses.hasDirtyAttributes, 'fragment array is clean');
      assert.ok(!person.hasDirtyAttributes, 'owner record is clean');
    });

    test('rollback after failed save restores lifecycle state', async function (assert) {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            name: { first: 'Cersei', last: 'Lannister' },
            addresses: [
              {
                street: '1 Red Keep',
                city: "King's Landing",
                region: 'Crownlands',
                country: 'Westeros',
              },
            ],
          },
        },
      });

      server.put('/people/1', () => {
        return [400, { 'Content-Type': 'application/json' }];
      });

      const person = await store.findRecord('person', 1);
      const name = person.name;
      const address = person.addresses.firstObject;

      name.set('first', 'Queen Cersei');
      address.set('street', '1 Throne Room');

      await assert.rejects(person.save());

      person.rollbackAttributes();

      assert.ok(!name.isNew, 'fragment is not new after rollback');
      assert.ok(!name.isDeleted, 'fragment is not deleted after rollback');
      assert.ok(!name.hasDirtyAttributes, 'fragment is clean after rollback');
      assert.equal(name.first, 'Cersei', 'fragment value is restored');

      assert.ok(
        !address.isNew,
        'fragment array item is not new after rollback',
      );
      assert.ok(
        !address.isDeleted,
        'fragment array item is not deleted after rollback',
      );
      assert.ok(
        !address.hasDirtyAttributes,
        'fragment array item is clean after rollback',
      );
      assert.equal(
        address.street,
        '1 Red Keep',
        'fragment array item value is restored',
      );

      assert.ok(
        !person.hasDirtyAttributes,
        'owner record is clean after rollback',
      );
    });
  });

  // ---- Edge cases ----

  module('edge cases', function () {
    test('fragment set to null then restored via rollback', async function (assert) {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            name: { first: 'Jon', last: 'Snow' },
          },
        },
      });

      const person = await store.findRecord('person', 1);
      const name = person.name;

      person.set('name', null);

      assert.equal(person.name, null, 'fragment is null');
      assert.ok(person.hasDirtyAttributes, 'owner record is dirty');

      person.rollbackAttributes();

      assert.equal(person.name, name, 'fragment is restored');
      assert.ok(!name.isNew, 'fragment is not new');
      assert.ok(!name.isDeleted, 'fragment is not deleted');
      assert.ok(!name.hasDirtyAttributes, 'fragment is clean');
      assert.ok(!person.hasDirtyAttributes, 'owner record is clean');
    });

    test('polymorphic fragment lifecycle after save', async function (assert) {
      const component = store.createRecord('component', {
        id: 10,
        type: 'text',
        options: {
          fontFamily: 'Arial',
          fontSize: 14,
        },
      });

      server.post('/components', () => [204]);

      await component.save();

      const options = component.options;

      assert.ok(!options.isNew, 'polymorphic fragment is not new after save');
      assert.ok(
        !options.isDeleted,
        'polymorphic fragment is not deleted after save',
      );
      assert.ok(
        !options.hasDirtyAttributes,
        'polymorphic fragment is clean after save',
      );
      assert.ok(
        !component.hasDirtyAttributes,
        'owner record is clean after save',
      );
    });
  });
});
