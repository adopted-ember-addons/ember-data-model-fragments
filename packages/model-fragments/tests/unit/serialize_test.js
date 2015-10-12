var env, store, Person, Name, House;

QUnit.module("unit - Serialization", {
  setup: function() {
    Person = DS.Model.extend({
      name: MF.fragment('name')
    });

    Name = MF.Fragment.extend({
      first: DS.attr('string'),
      last: DS.attr('string')
    });

    House = MF.Fragment.extend({
      name: DS.attr('string'),
      region: DS.attr('string'),
      exiled: DS.attr('boolean')
    });

    env = setupEnv({
      person: Person,
      name: Name,
      house: House
    });

    store = env.store;

    expectNoDeprecation();

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
  // The extra assertion comes from deprecation checking
  expect(8);

  Person.reopen({
    houses   : MF.fragmentArray('house', { defaultValue: [] }),
    children : MF.array({ defaultValue: [] })
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
      ok(name instanceof DS.Snapshot, "fragment snapshot attribute is a snapshot");
      equal(name.attr('first'), person.name.first, "fragment attributes are snapshoted correctly");

      var houses = snapshot.attr('houses');
      ok(Array.isArray(houses), "fragment array attribute is an array");
      ok(houses[0] instanceof DS.Snapshot, "fragment array attribute is an array of snapshots");
      equal(houses[0].attr('name'), person.houses[0].name, "fragment array attributes are snapshotted correctly");

      var children = snapshot.attr('children');
      ok(Array.isArray(children), "array attribute is an array");
      deepEqual(children, person.children, "array attribute is snapshotted correctly");
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
    var serialized = person.serialize();

    equal(serialized.name, 'Mad King', "serialization uses result from `fragment#serialize`");
  });
});

test("serializing a fragment array creates a new array with contents the result of serializing each fragment", function() {
  Person.reopen({
    names: MF.fragmentArray('name', { defaultValue: [] }),
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
    houses: MF.fragmentArray('house', { defaultValue: null }),
    children: MF.array({ defaultValue: null })
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
    equal(person.get('name'), null, 'fragment property values can be null');
    equal(person.get('houses'), null, 'fragment array property values can be null');
    equal(person.get('children'), null, '`array property values can be null');
  });
});
