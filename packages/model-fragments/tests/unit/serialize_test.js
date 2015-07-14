var env, store, Person, Name, House;
var all = Ember.RSVP.all;

module("unit/fragments - Serialization", {
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

    // TODO: this is necessary to set `typeKey` and prevent `store#serializerFor` from blowing up
    store.modelFor('person');
  },

  teardown: function() {
    env = null;
    store = null;
    Person = null;
    Name = null;
  }
});

test("fragment properties are snapshotted as normal attributes on the owner record snapshot", function() {
  expect(7);

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

test("fragment properties are serialized as normal attributes using their own serializers", function() {
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

test("serializing a fragment array creates a new array with contents the result of serializing each fragment", function() {
  Person.reopen({
    names: DS.hasManyFragments('name'),
  });

  var names = [
    {
      first: "Rhaegar",
      last: "Targaryen"
    },
    {
      first: "Viserys",
      last: "Targaryen"
    },
    {
      first: "Daenerys",
      last: "Targaryen"
    }
  ];

  store.push({
    type: 'person',
    id: 1,
    attributes: {
      names: names
    }
  });

  env.registry.register('serializer:name', env.serializer);

  return store.find('person', 1).then(function(person) {
    var serialized = person.serialize();

    deepEqual(serialized.names, names, "serializing returns array of each fragment serialized");
  });
});

test("normalizing data can handle `null` fragment values", function() {
  Person.reopen({
    houses   : DS.hasManyFragments('house'),
    children : DS.hasManyFragments()
  });

  var normalized = store.normalize('person', {
    name: null,
    houses: null,
    children: null
  });

  store.push({
    type: 'person',
    id: 1,
    attributes: normalized
  });

  return store.find('person', 1).then(function(person) {
    equal(person.get('name'), null, '`DS.hasOneFragment` values can be null');
    equal(person.get('houses'), null, '`DS.hasManyFragments` values can be null');
    equal(person.get('children'), null, '`typeless DS.hasManyFragments` values can be null');
  });
});