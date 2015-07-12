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

test("fragment properties are serialized as normal attributes using their own serializers", function() {
  // TODO: this is necessary to set `typeKey` and prevent `store#serializerFor` from blowing up
  store.modelFor('person');

  store.push({
    type: 'person',
    id: 1,
    attributes: {
      name: {
        first: "Aerys",
        last: "Targaryen"
      }
    }
  });

  env.registry.register('serializer:name', env.serializer.extend({
    serialize: function() {
      return 'Mad King';
    }
  }));

  return store.find('person', 1).then(function(person) {
    var name = person.get('name');

    var serialized = person.serialize();

    equal(serialized.name, 'Mad King', "serialization uses result from `fragment#serialize`");
  });
});

test("fragment properties are snapshotted as normal attributes on the owner record snapshot", function() {
  expect(7);

  // TODO: this is necessary to set `typeKey` and prevent `store#serializerFor` from blowing up
  store.modelFor('person');

  Person.reopen({
    houses   : DS.hasManyFragments('house'),
    children : DS.hasManyFragments()
  });

  var person = {
    name: {
      first : "Catelyn",
      last  : "Stark"
    },
    houses: [
      {
        name   : "Tully",
        region : "Riverlands",
        exiled : true
      },
      {
        name   : "Stark",
        region : "North",
        exiled : true
      }
    ],
    children: [
      'Robb',
      'Sansa',
      'Arya',
      'Brandon',
      'Rickon'
    ]
  };

  store.push({
    type: 'person',
    id: 1,
    attributes: person
  });

  env.registry.register('serializer:person', env.serializer.extend({
    serialize: function(snapshot) {
      var name = snapshot.attr('name');
      ok(name instanceof DS.Snapshot, "`hasOneFragment` snapshot attribute is a snapshot");
      equal(name.attr('first'), person.name.first, "`hasOneFragment` attributes are snapshoted correctly");

      var houses = snapshot.attr('houses');
      ok(Array.isArray(houses), "`hasManyFragments` attribute is an array");
      ok(houses[0] instanceof DS.Snapshot, "`hasManyFragments` attribute is an array of snapshots");
      equal(houses[0].attr('name'), person.houses[0].name, "`hasManyFragments` attributes are snapshotted correctly");

      var children = snapshot.attr('children');
      ok(Array.isArray(children), "primitive `hasManyFragments` attribute is an array");
      deepEqual(children, person.children, "primitive `hasManyFragments` attribute is snapshotted correctly");
    }
  }));

  return store.find('person', 1).then(function(person) {
    person.serialize();
  });
});
