var env, store, Person, Name;
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

    env = setupStore({
      person: Person,
      name: Name
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
  store.push(Person, {
    id: 1,
    name: {
      first: "Jon",
      last: "Snow"
    }
  });

  store.push(Person, { id: 2 });

  all([
    store.find(Person, 1),
    store.find(Person, 2)
  ]).then(async(function(people) {
    var copy = people[0].get('name').copy();

    people[1].set('name', copy);

    ok(true, "fragment copies can be assigned to other records");
  }));
});

test("fragments are `Ember.Comparable`", function() {
  var fragment = store.createFragment('name');

  ok(Ember.Comparable.detect(fragment), "fragments are copiable");
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

test("fragments are included in the owner record's `changedAttributes`", function() {
  store.push(Person, {
    id: 1,
    name: {
      first: "Loras",
      last: "Tyrell"
    }
  });

  store.find(Person, 1).then(async(function(person) {
    var name = person.get('name');

    name.set('last', 'Baratheon');

    var recordAttribtues = person.changedAttributes();
    var fragmentAttribtues = name.changedAttributes();

    deepEqual(recordAttribtues.name, fragmentAttribtues, "changed attributes are included in the owner record");
  }));
});

test("changes to attributes can be rolled back", function() {
  store.push(Person, {
    id: 1,
    name: {
      first: "Ramsay",
      last: "Snow"
    }
  });

  store.find(Person, 1).then(async(function(person) {
    var name = person.get('name');

    name.set('last', 'Bolton');
    name.rollback();

    ok(name.get('last', 'Snow'), "fragment properties are restored");
    ok(!name.get('isDirty'), "fragment is in clean state");
  }));
});

test("fragment properties are serialized as normal attributes using their own serializers", function() {
  store.push(Person, {
    id: 1,
    name: {
      first: "Aerys",
      last: "Targaryen"
    }
  });

  env.container.register('serializer:name', DS.JSONSerializer.extend({
    serialize: function() {
      return 'Mad King';
    }
  }));

  // TODO: this is necessary to set `typeKey` and prevent `store#serializerFor` from blowing up
  store.modelFor('person');

  store.find(Person, 1).then(async(function(person) {
    var name = person.get('name');

    var serialized = person.serialize();

    equal(serialized.name, 'Mad King', "serialization uses result from `fragment#serialize`");
  }));
});
