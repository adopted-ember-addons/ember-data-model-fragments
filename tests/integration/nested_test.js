import Ember from 'ember';
import MF from 'model-fragments';
import DS from 'ember-data';
import { test } from 'qunit';
import moduleForAcceptance from '../helpers/module-for-acceptance';
import getOwner from '../helpers/get-owner';
import Order from 'dummy/models/order';
import Product from 'dummy/models/product';
import Pretender from 'pretender';

var store, owner, server;

moduleForAcceptance("integration - Nested fragments", {
  beforeEach: function() {
    owner = getOwner(this);
    store = owner.lookup('service:store');
    server = new Pretender();
    //expectNoDeprecation();
  },

  afterEach: function() {
    store = null;
    owner = null;
    server.shutdown();
  }
});

test("`DS.hasManyFragment` properties can be nested", function(assert) {
  var data = {
    info: {
      name: 'Tyrion Lannister',
      notes: [ 'smart', 'short' ]
    },
    orders: [
      {
        amount   : '799.98',
        products : [
          {
            name   : 'Tears of Lys',
            sku    : 'poison-bd-32',
            price  : '499.99'
          },
          {
            name   : 'The Strangler',
            sku    : 'poison-md-24',
            price  : '299.99'
          }
        ]
      },
      {
        amount: '10999.99',
        products: [
          {
            name  : 'Lives of Four Kings',
            sku   : 'old-book-32',
            price : '10999.99'
          }
        ]
      }
    ]
  };

  return Ember.run(() => {
    store.push({
      data: {
        type: 'user',
        id: 1,
        attributes: Ember.copy(data, true)
      }
    });

    var payload = {
      user: Ember.copy(data, true)
    };
    payload.user.id = 1;
    payload.user.orders[0].products.splice(0, 1);

    server.put('/users/1', function() {
      return [ 200, {"Content-Type": "application/json"}, JSON.stringify(payload) ];
    });

    return store.find('user', 1).then(function(user) {
      assert.equal(user.get('orders.firstObject.products.firstObject.name'), 'Tears of Lys', "nested fragment array properties are converted properly");

      var product = user.get('orders.firstObject.products.firstObject');

      product.set('price', '1.99');
      assert.ok(user.get('hasDirtyAttributes'), "dirty state propagates to owner");

      user.rollbackAttributes();
      assert.equal(product.get('price'), '499.99', "rollbackAttributes cascades to nested fragments");
      assert.ok(!user.get('hasDirtyAttributes'), "dirty state is reset");

      user.get('orders.firstObject.products').removeAt(0);
      assert.ok(user.get('hasDirtyAttributes'), "dirty state propagates to owner");

      return user.save();
    }).then(function(user) {
      assert.ok(!user.get('hasDirtyAttributes'), "owner record is clean");
      assert.equal(user.get('orders.firstObject.products.length'), 1, "fragment array length is correct");
    });
  });
});

test("Fragments can be created with nested object literals", function(assert) {
  Ember.run(function() {
    var data = {
      info: {
        name: 'Tyrion Lannister',
        notes: [ 'smart', 'short' ]
      },
      orders: [
        {
          amount   : '799.98',
          products : [
            {
              name   : 'Tears of Lys',
              sku    : 'poison-bd-32',
              price  : '499.99'
            },
            {
              name   : 'The Strangler',
              sku    : 'poison-md-24',
              price  : '299.99'
            }
          ]
        },
        {
          amount: '10999.99',
          products: [
            {
              name  : 'Lives of Four Kings',
              sku   : 'old-book-32',
              price : '10999.99'
            }
          ]
        }
      ]
    };

    var user = store.createRecord('user', data);
    var orders = user.get('orders');

    assert.equal(orders.get('length'), 2, "fragment array length is correct");
    assert.ok(orders.get('firstObject') instanceof Order, "fragment instances are created");
    assert.equal(orders.get('firstObject.amount'), data.orders[0].amount, "fragment properties are correct");
    assert.equal(orders.get('firstObject.products.length'), 2, "nested fragment array length is correct");
    assert.ok(orders.get('firstObject.products.firstObject') instanceof Product, "nested fragment instances are created");
    assert.equal(orders.get('firstObject.products.firstObject.name'), data.orders[0].products[0].name, "nested fragment properties are correct");
  });
});

test("Nested fragments can have default values", function(assert) {
  Ember.run(function() {
    var defaultInfo = {
      notes: [ 'dangerous', 'sorry' ]
    };
    var defaultOrders = [
      {
        amount   : '1499.99',
        products : [
          {
            name  : 'Live Manticore',
            sku   : 'manticore-lv-2',
            price : '1499.99',
          }
        ]
      },
    ];

    var Assassin = DS.Model.extend({
      info   : MF.fragment("info", { defaultValue: defaultInfo }),
      orders : MF.fragmentArray("order", { defaultValue: defaultOrders })
    });

    owner.register('model:assassin', Assassin);

    var user = store.createRecord('assassin');

    assert.ok(user.get('info'), "a nested fragment is created with the default value");
    assert.deepEqual(user.get('info.notes').toArray(), defaultInfo.notes, "a doubly nested fragment array is created with the default value");
    assert.ok(user.get('orders.firstObject'), "a nested fragment array is created with the default value");
    assert.equal(user.get('orders.firstObject.amount'), defaultOrders[0].amount, "a nested fragment is created with the default value");
    assert.equal(user.get('orders.firstObject.products.firstObject.name'), defaultOrders[0].products[0].name, "a nested fragment is created with the default value");
  });
});

test("Nested fragments can be copied", function(assert) {
  var data = {
    info: {
      name: 'Petyr Baelish',
      notes: [ 'smart', 'despicable' ]
    },
    orders: [
      {
        recurring : true,
        product   : {
          name   : 'City Watch',
          sku    : 'bribe-3452',
          price  : '11099.99'
        }
      }
    ]
  };

  Ember.run(() => {
    store.push({
      data: {
        type: 'user',
        id: 1,
        attributes: Ember.copy(data, true)
      }
    });

    return store.find('user', 1).then(function(user) {
      var info = user.get('info').copy();

      assert.deepEqual(info.get('notes').toArray(), data.info.notes, 'nested fragment arrays are copied');
      assert.ok(info.get('notes') !== user.get('info.notes'), 'nested fragment array copies are new fragment arrays');

      var orders = user.get('orders').copy();
      var order = orders.objectAt(0);

      assert.equal(order.get('recurring'), data.orders[0].recurring, 'nested fragments are copied');
      assert.ok(order !== user.get('orders.firstObject'), 'nested fragment copies are new fragments');

      var product = order.get('product');

      assert.equal(product.get('name'), data.orders[0].product.name, 'nested fragments are copied');
      assert.ok(product !== user.get('orders.firstObject.product'), 'nested fragment copies are new fragments');
    });
  });
});

test("Nested fragments are destroyed when the owner record is destroyed", function(assert) {
  return Ember.run(() => {
    store.push({
      data: {
        type: 'user',
        id: 1,
        attributes: {
          info: {
            name: 'Tyrion Lannister',
            notes: [ 'smart', 'short' ]
          },
          orders: [
            {
              amount: '10999.99',
              products: [
                {
                  name  : 'Lives of Four Kings',
                  sku   : 'old-book-32',
                  price : '10999.99'
                }
              ]
            }
          ]
        }
      }
    });

    return store.find('user', 1).then(function(user) {
      var info = user.get('info');
      var notes = info.get('notes');
      var orders = user.get('orders');
      var order = orders.get('firstObject');
      var products = order.get('products');
      var product = products.get('firstObject');

      user.destroy();

      Ember.run.schedule('destroy', function() {
        assert.ok(user.get('isDestroying'), "the user is being destroyed");
        assert.ok(info.get('isDestroying'), "the info is being destroyed");
        assert.ok(notes.get('isDestroying'), "the notes are being destroyed");
        assert.ok(orders.get('isDestroying'), "the orders are being destroyed");
        assert.ok(order.get('isDestroying'), "the order is being destroyed");
        assert.ok(products.get('isDestroying'), "the products are being destroyed");
        assert.ok(product.get('isDestroying'), "the product is being destroyed");
      });
    });
  });
});
