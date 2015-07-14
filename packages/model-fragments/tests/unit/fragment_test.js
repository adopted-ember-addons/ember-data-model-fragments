var env, store, Person, Name, House;
var all = Ember.RSVP.all;

module("unit/fragments - DS.ModelFragment", {
  setup: function() {
    Person = DS.Model.extend({
      name: DS.hasOneFragment("name")
    });

    Name = DS.ModelFragment.extend({
      first : DS.attr("string"),
      last  : DS.attr("string")
    });

    House = DS.ModelFragment.extend({
      name   : DS.attr("string"),
      region : DS.attr("string"),
      exiled : DS.attr("boolean")
    });

    env = setupEnv({
      person: Person,
      name: Name,
      house: House
    });

    store = env.store;
  },

  teardown: function() {
    env = null;
    store = null;
    Person = null;
    Name = null;
  }
});

test("fragments are `Ember.Copyable`", function() {
  var fragment = store.createFragment('name');

  ok(Ember.Copyable.detect(fragment), "fragments are copyable");
});

test("copied fragments can be added to any record", function() {
  store.push({
    type: 'person',
    id: 1,
    attributes: {
      name: {
        first: "Jon",
        last: "Snow"
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
    var copy = people[0].get('name').copy();

    people[1].set('name', copy);

    ok(true, "fragment copies can be assigned to other records");
  });
});

test("fragments are `Ember.Comparable`", function() {
  var fragment = store.createFragment('name');

  ok(Ember.Comparable.detect(fragment), "fragments are comparable");
});

test("fragments are compared by reference", function() {
  var fragment1 = store.createFragment('name', {
    first: "Jon",
    last: "Arryn"
  });
  var fragment2 = store.createFragment('name', {
    first: "Jon",
    last: "Arryn"
  });

  ok(fragment1.compare(fragment1, fragment2) !== 0, "deeply equal objects are not the same");
  ok(fragment1.compare(fragment1, fragment1) === 0, "identical objects are the same");
});

test("changes to fragments are indicated in the owner record's `changedAttributes`", function() {
  store.push({
    type: 'person',
    id: 1,
    attributes: {
      name: {
        first: "Loras",
        last: "Tyrell"
      }
    }
  });

  return store.find('person', 1).then(function(person) {
    var name = person.get('name');

    name.set('last', 'Baratheon');

    equal(person.changedAttributes().name, true, "changed fragments are indicated in the diff object");
  });
});

test("fragment properties that are set to null are indicated in the owner record's `changedAttributes`", function() {
  store.push({
    type: 'person',
    id: 1,
    attributes: {
      name: {
        first: "Rob",
        last: "Stark"
      }
    }
  });

  return store.find('person', 1).then(function(person) {
    person.set('name', null);

    equal(person.changedAttributes().name, true, "null fragments are indicated in the diff object");
  });
});

test("changes to attributes can be rolled back", function() {
  store.push({
    type: 'person',
    id: 1,
    attributes: {
      name: {
        first: "Ramsay",
        last: "Snow"
      }
    }
  });

  return store.find('person', 1).then(function(person) {
    var name = person.get('name');

    name.set('last', 'Bolton');
    name.rollback();

    ok(name.get('last', 'Snow'), "fragment properties are restored");
    ok(!name.get('isDirty'), "fragment is in clean state");
  });
});
