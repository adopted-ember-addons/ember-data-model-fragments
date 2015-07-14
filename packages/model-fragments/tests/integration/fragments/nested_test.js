var env, store, User, Info, Order, Product;

module("integration/fragments - Nested fragments", {
  setup: function() {
    User = DS.Model.extend({
      info   : DS.hasOneFragment("info"),
      orders : DS.hasManyFragments("order")
    });

    Info = DS.ModelFragment.extend({
      name  : DS.attr("string"),
      notes : DS.hasManyFragments()
    });

    Order = DS.ModelFragment.extend({
      amount   : DS.attr("string"),
      products : DS.hasManyFragments("product")
    });

    Product = DS.ModelFragment.extend({
      name  : DS.attr("string"),
      sku   : DS.attr("string"),
      price : DS.attr("string"),
    });

    env = setupEnv({
      user    : User,
      info    : Info,
      order   : Order,
      product : Product
    });

    store = env.store;
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
    type: 'user',
    id: 1,
    attributes: Ember.copy(data, true)
  });

  env.adapter.updateRecord = function(store, type, record) {
    var payload = Ember.copy(data, true);

    payload.id = 1;
    payload.orders[0].products.splice(0, 1);

    return Ember.RSVP.resolve(payload);
  };

  return store.find('user', 1).then(function(user) {
    equal(user.get('orders.firstObject.products.firstObject.name'), 'Tears of Lys', "nested `DS.hasManyFragments` properties are converted properly");

    var product = user.get('orders.firstObject.products.firstObject');

    product.set('price', '1.99');
    ok(user.get('isDirty'), "dirty state propagates to owner");

    user.rollback();
    equal(product.get('price'), '499.99', "rollback cascades to nested fragments");
    ok(!user.get('isDirty'), "dirty state is reset");

    user.get('orders.firstObject.products').removeAt(0);
    ok(user.get('isDirty'), "dirty state propagates to owner");

    return user.save();
  }).then(function(user) {
    ok(!user.get('isDirty'), "owner record is clean");
    equal(user.get('orders.firstObject.products.length'), 1, "fragment array length is correct");
  });
});

test("Nested fragments fragments can have default values", function() {
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
    info   : DS.hasOneFragment("info", { defaultValue: defaultInfo }),
    orders : DS.hasManyFragments("order", { defaultValue: defaultOrders })
  });

  env.registry.register('model:assassin', Assassin);

  var user = store.createRecord('assassin');

  ok(user.get('info'), "a nested fragment is created with the default value");
  deepEqual(user.get('info.notes').toArray(), defaultInfo.notes, "a doubly nested fragment array is created with the default value");
  ok(user.get('orders.firstObject'), "a nested fragment array is created with the default value");
  equal(user.get('orders.firstObject.amount'), defaultOrders[0].amount, "a nested fragment is created with the default value");
  equal(user.get('orders.firstObject.products.firstObject.name'), defaultOrders[0].products[0].name, "a nested fragment is created with the default value");
});
