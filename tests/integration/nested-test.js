import Model from '@ember-data/model';
import { copy } from 'ember-data-model-fragments/util/copy';
import { schedule } from '@ember/runloop';
import { fragment, fragmentArray } from 'ember-data-model-fragments/attributes';
import { module, test } from 'qunit';
import { setupApplicationTest } from '../helpers';
import Order from 'dummy/models/order';
import Product from 'dummy/models/product';
import Pretender from 'pretender';

let store, owner, server;

module('integration - Nested fragments', function (hooks) {
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

  test('`DS.hasManyFragment` properties can be nested', async function (assert) {
    const data = {
      info: {
        name: 'Tyrion Lannister',
        notes: ['smart', 'short'],
      },
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
        {
          amount: '10999.99',
          products: [
            {
              name: 'Lives of Four Kings',
              sku: 'old-book-32',
              price: '10999.99',
            },
          ],
        },
      ],
    };

    store.push({
      data: {
        type: 'user',
        id: 1,
        attributes: copy(data, true),
      },
    });

    const payload = {
      user: copy(data, true),
    };
    payload.user.id = 1;
    payload.user.orders[0].products.removeAt(0, 1);

    server.put('/users/1', () => {
      return [
        200,
        { 'Content-Type': 'application/json' },
        JSON.stringify(payload),
      ];
    });

    const user = await store.findRecord('user', 1);

    assert.equal(
      user.orders.firstObject.products.firstObject.name,
      'Tears of Lys',
      'nested fragment array properties are converted properly',
    );

    const product = user.orders.firstObject.products.firstObject;

    product.set('price', '1.99');
    assert.ok(user.hasDirtyAttributes, 'dirty state propagates to owner');

    user.rollbackAttributes();
    assert.equal(
      product.price,
      '499.99',
      'rollbackAttributes cascades to nested fragments',
    );
    assert.ok(!user.hasDirtyAttributes, 'dirty state is reset');

    user.orders.firstObject.products.removeAt(0, 1);
    assert.ok(user.hasDirtyAttributes, 'dirty state propagates to owner');

    await user.save();

    assert.ok(!user.hasDirtyAttributes, 'owner record is clean');
    assert.equal(
      user.orders.firstObject.products.length,
      1,
      'fragment array length is correct',
    );
  });

  test('Fragments can be created with nested object literals', function (assert) {
    const data = {
      info: {
        name: 'Tyrion Lannister',
        notes: ['smart', 'short'],
      },
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
        {
          amount: '10999.99',
          products: [
            {
              name: 'Lives of Four Kings',
              sku: 'old-book-32',
              price: '10999.99',
            },
          ],
        },
      ],
    };

    const user = store.createRecord('user', data);
    const orders = user.orders;

    assert.equal(orders.length, 2, 'fragment array length is correct');
    assert.ok(
      orders.firstObject instanceof Order,
      'fragment instances are created',
    );
    assert.equal(
      orders.firstObject.amount,
      data.orders[0].amount,
      'fragment properties are correct',
    );
    assert.equal(
      orders.firstObject.products.length,
      2,
      'nested fragment array length is correct',
    );
    assert.ok(
      orders.firstObject.products.firstObject instanceof Product,
      'nested fragment instances are created',
    );
    assert.equal(
      orders.firstObject.products.firstObject.name,
      data.orders[0].products[0].name,
      'nested fragment properties are correct',
    );
  });

  test('Nested fragments can have default values', function (assert) {
    const defaultInfo = {
      notes: ['dangerous', 'sorry'],
    };
    const defaultOrders = [
      {
        amount: '1499.99',
        products: [
          {
            name: 'Live Manticore',
            sku: 'manticore-lv-2',
            price: '1499.99',
          },
        ],
      },
    ];

    class Assassin extends Model {
      @fragment('info', { defaultValue: defaultInfo }) info;
      @fragmentArray('order', { defaultValue: defaultOrders }) orders;
    }

    owner.register('model:assassin', Assassin);

    const user = store.createRecord('assassin');

    assert.ok(user.info, 'a nested fragment is created with the default value');
    assert.deepEqual(
      user.info.notes.toArray(),
      defaultInfo.notes,
      'a doubly nested fragment array is created with the default value',
    );
    assert.ok(
      user.orders.firstObject,
      'a nested fragment array is created with the default value',
    );
    assert.equal(
      user.orders.firstObject.amount,
      defaultOrders[0].amount,
      'a nested fragment is created with the default value',
    );
    assert.equal(
      user.orders.firstObject.products.firstObject.name,
      defaultOrders[0].products[0].name,
      'a nested fragment is created with the default value',
    );
  });

  test('Nested fragments can be copied', async function (assert) {
    const data = {
      info: {
        name: 'Petyr Baelish',
        notes: ['smart', 'despicable'],
      },
      orders: [
        {
          recurring: true,
          product: {
            name: 'City Watch',
            sku: 'bribe-3452',
            price: '11099.99',
          },
        },
      ],
    };

    store.push({
      data: {
        type: 'user',
        id: 1,
        attributes: copy(data, true),
      },
    });

    const user = await store.findRecord('user', 1);
    const info = user.info.copy();

    assert.deepEqual(
      info.notes.toArray(),
      data.info.notes,
      'nested fragment arrays are copied',
    );
    assert.ok(
      info.notes !== user.info.notes,
      'nested fragment array copies are new fragment arrays',
    );

    const orders = user.orders.copy();
    const order = orders.objectAt(0);

    assert.equal(
      order.recurring,
      data.orders[0].recurring,
      'nested fragments are copied',
    );
    assert.ok(
      order !== user.orders.firstObject,
      'nested fragment copies are new fragments',
    );

    const product = order.product;

    assert.equal(
      product.name,
      data.orders[0].product.name,
      'nested fragments are copied',
    );
    assert.ok(
      product !== user.orders.firstObject.product,
      'nested fragment copies are new fragments',
    );
  });

  test('Nested fragments are destroyed when the owner record is destroyed', async function (assert) {
    store.push({
      data: {
        type: 'user',
        id: 1,
        attributes: {
          info: {
            name: 'Tyrion Lannister',
            notes: ['smart', 'short'],
          },
          orders: [
            {
              amount: '10999.99',
              products: [
                {
                  name: 'Lives of Four Kings',
                  sku: 'old-book-32',
                  price: '10999.99',
                },
              ],
            },
          ],
        },
      },
    });

    const user = await store.findRecord('user', 1);
    const info = user.info;
    const notes = info.notes;
    const orders = user.orders;
    const order = orders.firstObject;
    const products = order.products;
    const product = products.firstObject;

    user.unloadRecord();

    schedule('destroy', () => {
      assert.ok(user.isDestroying, 'the user is being destroyed');
      assert.ok(info.isDestroying, 'the info is being destroyed');
      assert.ok(notes.isDestroying, 'the notes are being destroyed');
      assert.ok(orders.isDestroying, 'the orders are being destroyed');
      assert.ok(order.isDestroying, 'the order is being destroyed');
      assert.ok(products.isDestroying, 'the products are being destroyed');
      assert.ok(product.isDestroying, 'the product is being destroyed');
    });
  });
});
