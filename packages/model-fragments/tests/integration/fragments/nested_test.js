var env, store, User, Order, Product;

module("integration/fragments - Nested fragments", {
  setup: function() {
    User = DS.Model.extend({
      name      : DS.attr("string"),
      orders    : DS.hasManyFragments("order")
    });

    Order = DS.ModelFragment.extend({
      amount   : DS.attr("string"),
      products : DS.hasManyFragments("product")
    });

    Product = DS.ModelFragment.extend({
      name  : DS.attr("string"),
      sku   : DS.attr("string"),
      price : DS.attr("string")
    });

    env = setupStore({
      user    : User,
      order   : Order,
      product : Product
    });

    store = env.store;
  },

  teardown: function() {
    env = null;
    store = null;
    Name = null;
    Person = null;
    Address = null;
  }
});

test("`DS.hasManyFragment` properties can be nested", function() {
  var data = {
    id: 1,
    name: 'Tyrion Lannister',
    orders: [
      {
        amount   : '799.98',
        products : [
          {
            name   : 'Tears of Lys',
            sku    : 'poison-bd-32',
            amount : "499.99"
          },
          {
            name   : 'The Strangler',
            sku    : 'poison-md-24',
            amount : "299.99"
          }
        ]
      },
      {
        amount: '10999.99',
        products: [
          {
            name: 'Lives of Four Kings',
            sku: 'old-book-32',
            price: '10999.99'
          }
        ]
      }
    ]
  };

  store.push(User, Ember.copy(data, true));

  env.adapter.updateRecord = function(store, type, record) {
    var payload = Ember.copy(data, true);

    payload.orders[0].products.splice(0, 1);

    return Ember.RSVP.resolve(payload);
  };

  store.find(User, 1).then(async(function(user) {
    equal(user.get('orders.firstObject.products.firstObject.name'), 'Tears of Lys', "nested `DS.hasManyFragments` properties are deserialized properly");

    user.get('orders.firstObject.products').removeAt(0);
    ok(user.get('isDirty'), "dirty state propagates to owner");

    return user.save();
  })).then(async(function(user) {
    ok(!user.get('isDirty'), "owner record is clean");
    equal(user.get('orders.firstObject.products.length'), 1, "fragment array length is correct");
  }));
});
