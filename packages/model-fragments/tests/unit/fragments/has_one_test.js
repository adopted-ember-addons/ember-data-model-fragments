var store, Person, Name;
var all = Ember.RSVP.all;

module("unit/fragments - DS.hasOneFragment", {
  setup: function() {
    Person = DS.Model.extend({
      name  : DS.hasOneFragment("name"),
      title : DS.attr('string')
    });

    Name = DS.ModelFragment.extend({
      first : DS.attr("string"),
      last  : DS.attr("string")
    });

    store = createStore({
      name: Name
    });
  },

  teardown: function() {
    store = null;
    Person = null;
    Name = null;
  }
});

test("object literals are converted to instances of `DS.ModelFragment`", function() {
  store.push(Person, {
    id: 1,
    name: {
      first: "Tyrion",
      last: "Lannister"
    }
  });

  store.find(Person, 1).then(async(function(person) {
    ok(person.get('name') instanceof Name, "name property is an `DS.ModelFragment` instance");

    equal(person.get('name.first'), 'Tyrion', "nested properties have original value");
  }));
});

test("a fragment can be created through the store and set", function() {
  store.push(Person, { id: 1 });

  store.find(Person, 1).then(async(function(person) {
    var name = store.createFragment('name', {
      first: "Davos",
      last: "Seaworth"
    });

    person.set('name', name);

    equal(person.get('name.first'), 'Davos', "new fragment is correctly set");
  }));
});

test("setting to a non-fragment model throws an error", function() {
  store.push(Person, { id: 1 });

  store.find(Person, 1).then(async(function(person) {
    throws(function() {
      person.set('name', store.createRecord('person'));
    }, "error is thrown when setting non-fragment");
  }));
});

test("setting fragments from other records throws an error", function() {
  store.push(Person, {
    id: 1,
    name: {
      first: "Roose",
      last: "Bolton"
    }
  });

  store.push(Person, { id: 2 });

  all([
    store.find(Person, 1),
    store.find(Person, 2)
  ]).then(async(function(people) {
    throws(function() {
      person[1].set('name', person[0].get('name'));
    }, "error is thrown when setting to a fragment of another record");
  }));
});

test("null values are allowed", function() {
  store.push(Person, {
    id: 1,
    name: null
  });

  store.find(Person, 1).then(async(function(person) {
    equal(person.get('name'), null, "property is null");
  }));
});

test("setting to null is allowed", function() {
  store.push(Person, {
    id: 1,
    name: {
      first: "Barristan",
      last: "Selmy"
    }
  });

  store.find(Person, 1).then(async(function(person) {
    person.set('name', null);
    equal(person.get('name'), null, "property is null");
  }));
});

test("fragments can have default values", function() {
  var defaultValue = {
    first: "Iron",
    last: "Victory"
  };

  var Ship = DS.Model.extend({
    name: DS.hasOneFragment("name", { defaultValue: defaultValue }),
  });

  var ship = store.createRecord(Ship);

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

  var sword = store.createRecord(Sword);

  equal(sword.get('name.first'), defaultValue.first, "the default value is correct");
});
