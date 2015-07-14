var env, store, Person, Address, people;
var all = Ember.RSVP.all;

module("unit/fragments - DS.hasManyFragments", {
  setup: function() {
    Person = DS.Model.extend({
      name      : DS.attr("string"),
      addresses : DS.hasManyFragments("address"),
      titles    : DS.hasManyFragments()
    });

    Address = DS.ModelFragment.extend({
      street  : DS.attr("string"),
      city    : DS.attr("string"),
      region  : DS.attr("string"),
      country : DS.attr("string")
    });

    env = setupEnv({
      person: Person,
      address: Address
    });

    store = env.store;

    people = [
      {
        id: 1,
        name: "Tyrion Lannister",
        addresses: [
          {
            street: "1 Sky Cell",
            city: "Eyre",
            region: "Vale of Arryn",
            country: "Westeros"
          },
          {
            street: "1 Tower of the Hand",
            city: "King's Landing",
            region: "Crownlands",
            country: "Westeros"
          }
        ]
      },
      {
        id: 2,
        name: "Eddard Stark",
        addresses: [
          {
            street: "1 Great Keep",
            city: "Winterfell",
            region: "North",
            country: "Westeros"
          }
        ]
      },
      {
        id: 3,
        name: "Jojen Reed",
        addresses: null
      }
    ];
  },

  teardown: function() {
    env = null;
    store = null;
    Person = null;
    Address = null;
    people = null;
  }
});

function pushPerson(id) {
  store.push({
    type: 'person',
    id: id,
    attributes: Ember.A(people).findBy('id', id)
  });
}

test("properties are instances of `DS.FragmentArray`", function() {
  pushPerson(1);

  return store.find('person', 1).then(function(person) {
    var addresses = person.get('addresses');

    ok(Ember.isArray(addresses), "property is array-like");
    ok(addresses instanceof DS.FragmentArray, "property is an instance of `DS.FragmentArray`");
  });
});

test("arrays of object literals are converted into instances of `DS.ModelFragment`", function() {
  pushPerson(1);

  return store.find('person', 1).then(function(person) {
    var addresses = person.get('addresses');

    ok(addresses.every(function(address) {
      return address instanceof Address;
    }), "each fragment is a `DS.ModelFragment` instance");
  });
});

test("arrays of primitives are converted to an array-ish containing original values", function() {
  var values = [ "Hand of the King", "Master of Coin" ];

  store.push({
    type: 'person',
    id: 1,
    attributes: {
      name: {
        first: "Tyrion",
        last: "Lannister"
      },
      titles: values
    }
  });

  return store.find('person', 1).then(function(person) {
    var titles = person.get('titles');

    ok(Ember.isArray(titles), "titles property is array-like");

    ok(titles.every(function(title, index) {
      return title === values[index];
    }), "each title matches the original value");

  });
});

test("fragments created through the store can be added to the fragment array", function() {
  pushPerson(1);

  return store.find('person', 1).then(function(person) {
    var addresses = person.get('addresses');
    var length = addresses.get('length');

    var address = store.createFragment('address', {
      street: "1 Dungeon Cell",
      city: "King's Landing",
      region: "Crownlands",
      country: "Westeros"
    });

    addresses.addFragment(address);

    equal(addresses.get('length'), length + 1, "address property size is correct");
    equal(addresses.indexOf(address), length, "new fragment is in correct location");
  });
});

test("adding a non-fragment model throws an error", function() {
  pushPerson(1);

  return store.find('person', 1).then(function(person) {
    var addresses = person.get('addresses');

    throws(function() {
      var otherPerson = store.createRecord('person');

      addresses.addFragment(otherPerson);
    }, "error is thrown when adding a DS.Model instance");
  });
});

test("adding fragments from other records throws an error", function() {
  pushPerson(1);
  pushPerson(2);

  return all([
    store.find('person', 1),
    store.find('person', 2)
  ]).then(function(people) {
    var address = people[0].get('addresses.firstObject');

    throws(function() {
      people[1].get('addresses').addFragment(address);
    }, "error is thrown when adding a fragment from another record");
  });
});

test("setting to an array of fragments is allowed", function() {
  pushPerson(1);

  return store.find('person', 1).then(function(person) {
    var addresses = person.get('addresses');

    var address = store.createFragment('address', {
      street: "1 Dungeon Cell",
      city: "King's Landing",
      region: "Crownlands",
      country: "Westeros"
    });

    person.set('addresses', [ address ]);

    equal(person.get('addresses'), addresses, "fragment array is the same object");
    equal(person.get('addresses.length'), 1, "fragment array has the correct length");
    equal(person.get('addresses.firstObject'), address, "fragment array contains the new fragment");
  });
});

test("null values are allowed", function() {
  pushPerson(3);

  return store.find('person', 3).then(function(person) {
    equal(person.get('addresses'), null, "property is null");
  });
});

test("setting to null is allowed", function() {
  pushPerson(1);

  return store.find('person', 1).then(function(person) {
    person.set('addresses', null);

    equal(person.get('addresses'), null, "property is null");
  });
});

test("setting to an array of non-fragments throws an error", function() {
  pushPerson(1);

  return store.find('person', 1).then(function(person) {
    throws(function() {
      person.set('addresses', [ 'address' ]);
    }, "error is thrown when setting to an array of non-fragments");
  });
});

test("fragments can have default values", function() {
  var defaultValue = [
    {
      street: "1 Throne Room",
      city: "King's Landing",
      region: "Crownlands",
      country: "Westeros"
    }
  ];

  var Throne = DS.Model.extend({
    name: DS.attr('string'),
    addresses: DS.hasManyFragments('address', { defaultValue: defaultValue })
  });

  env.registry.register('model:throne', Throne);

  var throne = store.createRecord('throne', { name: 'Iron' });

  equal(throne.get('addresses.firstObject.street'), defaultValue[0].street, "the default value is correct");
});

test("fragment default values can be functions", function() {
  var defaultValue = [
    {
      street: "1 Great Keep",
      city: "Winterfell",
      region: "North",
      country: "Westeros"
    }
  ];

  var Sword = DS.Model.extend({
    name: DS.attr('string'),
    addresses: DS.hasManyFragments('address', { defaultValue: function() { return defaultValue; } })
  });

  env.registry.register('model:sword', Sword);

  var sword = store.createRecord('sword', { name: 'Ice' });

  equal(sword.get('addresses.firstObject.street'), defaultValue[0].street, "the default value is correct");
});
