var env, store, Person, Name, Address;

module("integration/fragments - Persisting Records With Fragments", {
  setup: function() {
    Person = DS.Model.extend({
      name      : DS.hasOneFragment("name"),
      addresses : DS.hasManyFragments("address"),
    });

    Name = DS.ModelFragment.extend({
      first  : DS.attr("string"),
      last   : DS.attr("string")
    });

    Address = DS.ModelFragment.extend({
      street  : DS.attr("string"),
      city    : DS.attr("string"),
      region  : DS.attr("string"),
      country : DS.attr("string")
    });

    env = setupEnv({
      person  : Person,
      name    : Name,
      address : Address
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

test("persisting the owner record in a clean state maintains clean state", function() {
  store.push({
    type: 'person',
    id: 1,
    attributes: {
      name: {
        first: "Tyrion",
        last: "Lannister"
      },
      addresses: [
        {
          street: "1 Sky Cell",
          city: "Eyre",
          region: "Vale of Arryn",
          country: "Westeros"
        }
      ]
    }
  });

  env.adapter.updateRecord = function(store, type, record) {
    return Ember.RSVP.resolve();
  };

  return store.find('person', 1).then(function(person) {
    return person.save();
  }).then(function(person) {
    var name = person.get('name');
    var addresses = person.get('addresses');

    ok(!name.get('isDirty'), "`DS.hasOneFragment` fragment is clean");
    ok(!addresses.isAny('isDirty'), "all `DS.hasManyFragments` fragments are clean");
    ok(!addresses.get('isDirty'), "fragment array is clean");
    ok(!person.get('isDirty'), "owner record is clean");
  });
});

test("persisting the owner record when a fragment is dirty moves owner record, fragment array, and all fragments into clean state", function() {
  store.push({
    type: 'person',
    id: 1,
    attributes: {
      name: {
        first: "Eddard",
        last: "Stark"
      },
      addresses: [
        {
          street: "1 Great Keep",
          city: "Winterfell",
          region: "North",
          country: "Westeros"
        }
      ]
    }
  });

  env.adapter.updateRecord = function(store, type, record) {
    return Ember.RSVP.resolve();
  };

  return store.find('person', 1).then(function(person) {
    var name = person.get('name');
    var address = person.get('addresses.firstObject');

    name.set('first', 'Arya');
    address.set('street', '1 Godswood');

    return person.save();
  }).then(function(person) {
    var name = person.get('name');
    var addresses = person.get('addresses');
    var address = addresses.get('firstObject');

    equal(name.get('first'), 'Arya', "`DS.hasOneFragment` change is persisted");
    equal(address.get('street'), '1 Godswood', "`DS.hasManyFragments` change is persisted");
    ok(!name.get('isDirty'), "`DS.hasOneFragment` fragment is clean");
    ok(!addresses.isAny('isDirty'), "all `DS.hasManyFragments` fragments are clean");
    ok(!addresses.get('isDirty'), "fragment array is clean");
    ok(!person.get('isDirty'), "owner record is clean");
  });
});

test("persisting a new owner record moves the owner record, fragment array, and all fragments into clean state", function() {
  var data = {
    name: {
      first: "Daenerys",
      last: "Targaryen"
    },
    addresses: [
      store.createFragment('address', {
        street: "1 Stone Drum",
        city: "Dragonstone",
        region: "Crownlands",
        country: "Westeros"
      })
    ]
  };

  var person = store.createRecord('person');
  person.set('name', store.createFragment('name', data.name));
  person.set('addresses', data.addresses);

  env.adapter.createRecord = function(store, type, record) {
    var payload = Ember.copy(data, true);

    payload.id = 3;

    return Ember.RSVP.resolve(payload);
  };

  return person.save().then(function(person) {
    var name = person.get('name');
    var addresses = person.get('addresses');

    ok(!name.get('isDirty'), "`DS.hasOneFragment` fragment is clean");
    ok(!addresses.isAny('isDirty'), "all `DS.hasManyFragments` fragments are clean");
    ok(!addresses.get('isDirty'), "fragment array is clean");
    ok(!person.get('isDirty'), "owner record is clean");
  });
});

test("a new record can be persisted with null fragments", function() {
  var person = store.createRecord('person');

  equal(person.get('name'), null, "`DS.hasOneFragment` property is null");
  equal(person.get('addresses'), null, "`DS.hasManyFragments` property is null");

  env.adapter.createRecord = function(store, type, record) {
    var payload = { id: 1 };

    return Ember.RSVP.resolve(payload);
  };

  return person.save().then(function(person) {
    equal(person.get('name'), null, "`DS.hasOneFragment` property is still null");
    equal(person.get('addresses'), null, "`DS.hasManyFragments` property is still null");
    ok(!person.get('isDirty'), "owner record is clean");
  });
});

test("the adapter can update fragments on save", function() {
  var data = {
    name: {
      first: "Eddard",
      last: "Stark"
    },
    addresses: [
      {
        street: "1 Great Keep",
        city: "Winterfell",
        region: "North",
        country: "Westeros"
      }
    ]
  };

  store.push({
    type: 'person',
    id: 1,
    attributes: data
  });

  env.adapter.updateRecord = function(store, type, record) {
    var payload = Ember.copy(data, true);

    payload.id = 1;
    payload.name.first = 'Ned';
    payload.addresses[0].street = '1 Godswood';

    return Ember.RSVP.resolve(payload);
  };

  return store.find('person', 1).then(function(person) {
    return person.save();
  }).then(function(person) {
    var name = person.get('name');
    var addresses = person.get('addresses');

    ok(!name.get('isDirty'), "`DS.hasOneFragment` fragment is clean");
    ok(!addresses.isAny('isDirty'), "all `DS.hasManyFragments` fragments are clean");
    ok(!addresses.get('isDirty'), "fragment array is clean");
    ok(!person.get('isDirty'), "owner record is clean");
    equal(name.get('first'), 'Ned', "`DS.hasOneFragment` fragment correctly updated");
    equal(addresses.get('firstObject.street'), '1 Godswood', "`DS.hasManyFragments` fragment correctly updated");
  });
});

test("existing fragments are updated on save", function() {
  var data = {
    name: {
      first: "Eddard",
      last: "Stark"
    },
    addresses: [
      {
        street: "1 Great Keep",
        city: "Winterfell",
        region: "North",
        country: "Westeros"
      }
    ]
  };

  store.push({
    type: 'person',
    id: 1,
    attributes: data
  });

  env.adapter.updateRecord = function(store, type, record) {
    var payload = Ember.copy(data, true);

    payload.id = 1;
    payload.name.first = 'Ned';
    payload.addresses.unshift({
      street: "1 Red Keep",
      city: "Kings Landing",
      region: "Crownlands",
      country: "Westeros"
    });

    return Ember.RSVP.resolve(payload);
  };

  var name, addresses, address;

  return store.find('person', 1).then(function(person) {
    name = person.get('name');
    addresses = person.get('addresses');
    address = addresses.get('firstObject');
    return person.save();
  }).then(function(person) {
    equal(name.get('first'), 'Ned', "`DS.hasOneFragment` fragment correctly updated");
    equal(address.get('street'), '1 Red Keep', "`DS.hasManyFragments` fragment correctly updated");
    equal(addresses.get('length'), 2, "`DS.hasManyFragments` fragment correctly updated");
  });
});

test("the adapter can update fragments on reload", function() {
  var data = {
    name: {
      first: "Brandon",
      last: "Stark"
    },
    addresses: [
      {
        street: "1 Great Keep",
        city: "Winterfell",
        region: "North",
        country: "Westeros"
      }
    ]
  };

  store.push({
    type: 'person',
    id: 1,
    attributes: data
  });

  env.adapter.find = function(store, type, id, record) {
    var payload = Ember.copy(data, true);

    payload.id = 1;
    payload.name.first = 'Bran';
    payload.addresses[0].street = '1 Broken Tower';

    return Ember.RSVP.resolve(payload);
  };

  return store.find('person', 1).then(function(person) {
    // Access values that will change to prime CP cache
    person.get('name.first');
    person.get('addresses.firstObject.street');

    return person.reload();
  }).then(function(person) {
    var name = person.get('name');
    var addresses = person.get('addresses');

    equal(name.get('first'), 'Bran', "`DS.hasOneFragment` fragment correctly updated");
    equal(addresses.get('firstObject.street'), '1 Broken Tower', "`DS.hasManyFragments` fragment correctly updated");
  });
});

/*
  Currently in certain annoying cases in Ember, including aliases or proxies that are actively observed,
  CPs are consumed as soon as they are changed. If we are not careful, this can cause infinite loops when
  updating existing fragment data
*/
test("the adapter can update fragments without infinite loops when CPs are eagerly consumed", function() {
  var data = {
    name: {
      first: "Brandon",
      last: "Stark"
    },
    addresses: [
      {
        street: "1 Great Keep",
        city: "Winterfell",
        region: "North",
        country: "Westeros"
      }
    ]
  };

  store.push({
    type: 'person',
    id: 1,
    attributes: data
  });

  return store.find('person', 1).then(function(person) {
    var personController = Ember.Controller.create({ content: person });

    Ember.addObserver(personController, 'model.name.first', function() {});
    personController.get('model.name.first');

    store.push({
      type: 'person',
      id: 1,
      attributes: data
    });

    equal(person.get('name.first'), 'Brandon');
  });
});

// TODO: The data in the adapter response is not actually changing here, which
// means that the property actually _shouldn't_ be notified. Doing so requires
// value diffing of deserialized model data, which means either saving a copy of
// the data before giving it to the fragment
test("`DS.hasManyFragments` array properties are notified on save", function() {
  expect(1);

  var data = {
    name: {
      first: "Eddard",
      last: "Stark"
    },
    addresses: [
      {
        street: "1 Great Keep",
        city: "Winterfell",
        region: "North",
        country: "Westeros"
      }
    ]
  };

  var PersonObserver = Ember.Object.extend({
    person: null,
    observer: Ember.observer('person.addresses.[]', function(obj, key) {
      ok(true, "The array change was observed");
    })
  });

  store.push({
    type: 'person',
    id: 1,
    attributes: data
  });

  env.adapter.updateRecord = function() {
    var payload = Ember.copy(data, true);

    payload.id = 1;

    return Ember.RSVP.resolve(payload);
  };

  return store.find('person', 1).then(function(person) {
    PersonObserver.create({ person: person });
    return person.save();
  });
});

test("`DS.hasManyFragments` properties are notifed on reload", function() {
  expect(1);

  var Army = DS.Model.extend({
    name     : DS.attr('string'),
    soldiers : DS.hasManyFragments()
  });

  env.registry.register('model:army', Army);

  var data = {
    name: "Golden Company",
    soldiers: [
      "Aegor Rivers",
      "Jon Connington",
      "Tristan Rivers"
    ]
  };

  var ArmyObserver = Ember.Object.extend({
    army: null,
    observer: Ember.observer('army.soldiers.[]', function() {
      equal(this.get('army.soldiers.length'), 2, "The array change to was observed");
    })
  });

  store.push({
    type: 'army',
    id: 1,
    attributes: data
  });

  env.adapter.find = function(store, type, record) {
    var payload = Ember.copy(data, true);

    payload.id = 1;
    payload.soldiers.shift();

    return Ember.RSVP.resolve(payload);
  };

  return store.find('army', 1).then(function(army) {
    var proxy = ArmyObserver.create({ army: army });
    return army.reload();
  });
});
