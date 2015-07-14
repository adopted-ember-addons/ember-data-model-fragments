var env, store, Person, Name;
var all = Ember.RSVP.all;

QUnit.module("unit/fragments - DS.hasOneFragment", {
  setup: function() {
    Person = DS.Model.extend({
      name  : DS.hasOneFragment("name"),
      title : DS.attr('string')
    });

    Name = DS.ModelFragment.extend({
      first : DS.attr("string"),
      last  : DS.attr("string")
    });

    env = setupEnv({
      person: Person,
      name: Name
    });

    store = env.store;

    expectNoDeprecation();
  },

  teardown: function() {
    env = null;
    store = null;
    Person = null;
    Name = null;
  }
});

test("object literals are converted to instances of `DS.ModelFragment`", function() {
  store.push({
    type: 'person',
    id: 1,
    attributes: {
      name: {
        first: "Tyrion",
        last: "Lannister"
      }
    }
  });

  return store.find('person', 1).then(function(person) {
    ok(person.get('name') instanceof Name, "name property is an `DS.ModelFragment` instance");

    equal(person.get('name.first'), 'Tyrion', "nested properties have original value");
  });
});

test("a fragment can be created through the store and set", function() {
  store.push({
    type: 'person',
    id: 1,
    attributes: {}
  });

  return store.find('person', 1).then(function(person) {
    var name = store.createFragment('name', {
      first: "Davos",
      last: "Seaworth"
    });

    person.set('name', name);

    equal(person.get('name.first'), 'Davos', "new fragment is correctly set");
  });
});

test("setting to a non-fragment model throws an error", function() {
  store.push({
    type: 'person',
    id: 1,
    attributes: {}
  });

  return store.find('person', 1).then(function(person) {
    throws(function() {
      person.set('name', store.createRecord('person'));
    }, "error is thrown when setting non-fragment");
  });
});

test("setting fragments from other records throws an error", function() {
  store.push({
    type: 'person',
    id: 1,
    attributes: {
      name: {
        first: "Roose",
        last: "Bolton"
      }
    }
  });

  store.push({
    type: 'person',
    id: 2,
    attributes: {}
  });

  return all([
    store.find('person', 1),
    store.find('person', 2)
  ]).then(function(people) {
    throws(function() {
      people[1].set('name', people[0].get('name'));
    }, "error is thrown when setting to a fragment of another record");
  });
});

test("null values are allowed", function() {
  store.push({
    type: 'person',
    id: 1,
    attributes: {
      name: null
    }
  });

  return store.find('person', 1).then(function(person) {
    equal(person.get('name'), null, "property is null");
  });
});

test("setting to null is allowed", function() {
  store.push({
    type: 'person',
    id: 1,
    attributes: {
      name: {
        first: "Barristan",
        last: "Selmy"
      }
    }
  });

  return store.find('person', 1).then(function(person) {
    person.set('name', null);
    equal(person.get('name'), null, "property is null");
  });
});

test("fragments can have default values", function() {
  var defaultValue = {
    first: "Iron",
    last: "Victory"
  };

  var Ship = DS.Model.extend({
    name: DS.hasOneFragment("name", { defaultValue: defaultValue }),
  });

  env.registry.register('model:ship', Ship);

  var ship = store.createRecord('ship');

  equal(ship.get('name.first'), defaultValue.first, "the default value is correct");
});

test("fragment default values can be functions", function() {
  var defaultValue = {
    first: "Oath",
    last: "Keeper"
  };

  var Sword = DS.Model.extend({
    name: DS.hasOneFragment("name", { defaultValue: function() { return defaultValue; } }),
  });

  env.registry.register('model:sword', Sword);

  var sword = store.createRecord('sword');

  equal(sword.get('name.first'), defaultValue.first, "the default value is correct");
});
