var env, store, User, Info, Order, Product;

QUnit.module("integration - Nested fragments", {
  setup: function() {
    User = DS.Model.extend({
      info: MF.fragment('info'),
      orders: MF.fragmentArray('order')
    });

    Info = MF.Fragment.extend({
      name: DS.attr('string'),
      notes: MF.array()
    });

    Order = MF.Fragment.extend({
      amount: DS.attr('string'),
      products: MF.fragmentArray('product')
    });

    Product = MF.Fragment.extend({
      name: DS.attr('string'),
      sku: DS.attr('string'),
      price: DS.attr('string'),
    });

    env = setupEnv({
      user: User,
      info: Info,
      order: Order,
      product: Product
    });

    store = env.store;

    expectNoDeprecation();
  },

  teardown: function() {
    env = null;
    store = null;
    User = null;
    Info = null;
    Order = null;
    Product = null;
  }
});

test("`DS.hasManyFragment` properties can be nested", function() {
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

  store.push({
    data: {
      type: 'user',
      id: 1,
      attributes: Ember.copy(data, true)
    }
  });

  env.adapter.updateRecord = function() {
    var payload = Ember.copy(data, true);

    payload.id = 1;
    payload.orders[0].products.splice(0, 1);

    return Ember.RSVP.resolve(payload);
  };

  return store.find('user', 1).then(function(user) {
    equal(user.get('orders.firstObject.products.firstObject.name'), 'Tears of Lys', "nested fragment array properties are converted properly");

    var product = user.get('orders.firstObject.products.firstObject');

    product.set('price', '1.99');
    ok(user.get('hasDirtyAttributes'), "dirty state propagates to owner");

    user.rollbackAttributes();
    equal(product.get('price'), '499.99', "rollbackAttributes cascades to nested fragments");
    ok(!user.get('hasDirtyAttributes'), "dirty state is reset");

    user.get('orders.firstObject.products').removeAt(0);
    ok(user.get('hasDirtyAttributes'), "dirty state propagates to owner");

    return user.save();
  }).then(function(user) {
    ok(!user.get('hasDirtyAttributes'), "owner record is clean");
    equal(user.get('orders.firstObject.products.length'), 1, "fragment array length is correct");
  });
});

test("Fragments can be created with nested object literals", function() {
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

  equal(orders.get('length'), 2, "fragment array length is correct");
  ok(orders.get('firstObject') instanceof Order, "fragment instances are created");
  equal(orders.get('firstObject.amount'), data.orders[0].amount, "fragment properties are correct");
  equal(orders.get('firstObject.products.length'), 2, "nested fragment array length is correct");
  ok(orders.get('firstObject.products.firstObject') instanceof Product, "nested fragment instances are created");
  equal(orders.get('firstObject.products.firstObject.name'), data.orders[0].products[0].name, "nested fragment properties are correct");
});

test("Nested fragments can have default values", function() {
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

  env.registry.register('model:assassin', Assassin);

  var user = store.createRecord('assassin');

  ok(user.get('info'), "a nested fragment is created with the default value");
  deepEqual(user.get('info.notes').toArray(), defaultInfo.notes, "a doubly nested fragment array is created with the default value");
  ok(user.get('orders.firstObject'), "a nested fragment array is created with the default value");
  equal(user.get('orders.firstObject.amount'), defaultOrders[0].amount, "a nested fragment is created with the default value");
  equal(user.get('orders.firstObject.products.firstObject.name'), defaultOrders[0].products[0].name, "a nested fragment is created with the default value");
});

test("Nested fragments can be copied", function() {
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

  Order.reopen({
    recurring : DS.attr('boolean'),
    product   : MF.fragment('product')
  });

  store.push({
    data: {
      type: 'user',
      id: 1,
      attributes: Ember.copy(data, true)
    }
  });

  return store.find('user', 1).then(function(user) {
    var info = user.get('info').copy();

    deepEqual(info.get('notes').toArray(), data.info.notes, 'nested fragment arrays are copied');
    ok(info.get('notes') !== user.get('info.notes'), 'nested fragment array copies are new fragment arrays');

    var orders = user.get('orders').copy();
    var order = orders.objectAt(0);

    equal(order.get('recurring'), data.orders[0].recurring, 'nested fragments are copied');
    ok(order !== user.get('orders.firstObject'), 'nested fragment copies are new fragments');

    var product = order.get('product');

    equal(product.get('name'), data.orders[0].product.name, 'nested fragments are copied');
    ok(product !== user.get('orders.firstObject.product'), 'nested fragment copies are new fragments');
  });
});
