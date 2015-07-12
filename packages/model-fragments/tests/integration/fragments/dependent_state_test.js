var env, store, Person, Name, Address, people;

module("integration/fragments - Dependent State", {
  setup: function() {
    Person = DS.Model.extend({
      title     : DS.attr("string"),
      name      : DS.hasOneFragment("name"),
      addresses : DS.hasManyFragments("address"),
      titles    : DS.hasManyFragments()
    });

    Name = DS.ModelFragment.extend({
      first : DS.attr("string"),
      last  : DS.attr("string")
    });

    Address = DS.ModelFragment.extend({
      street  : DS.attr("string"),
      city    : DS.attr("string"),
      region  : DS.attr("string"),
      country : DS.attr("string")
    });

    env = setupEnv({
      person: Person,
      name: Name,
      address: Address
    });

    store = env.store;

    people = [
      {
        id: 1,
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
          },
          {
            street: "1 Tower of the Hand",
            city: "King's Landing",
            region: "Crownlands",
            country: "Westeros"
          }
        ],
        titles: [
          "Hand of the King",
          "Master of Coin"
        ]
      }
    ];
  },

  teardown: function() {
    env = null;
    store = null;
    Person = null;
    Address = null;
    Name = null;
    people = null;
  }
});

function pushPerson(id) {
  store.push('person', Ember.copy(Ember.A(people).findBy('id', id), true));
}

test("changing a `DS.hasOneFragment` fragment property dirties the fragment and owner record", function() {
  store.push('person', {
    id: 1,
    name: {
      first: "Jamie",
      last: "Lannister"
    }
  });

  return store.find('person', 1).then(function(person) {
    var name = person.get('name');

    name.set('first', 'Cercei');

    ok(name.get('isDirty'), "fragment is dirty");
    ok(person.get('isDirty'), "owner record is dirty");
  });
});

test("restoring a `DS.hasOneFragment` fragment to its original state returns the fragment and owner record to a clean state", function() {
  store.push('person', {
    id: 1,
    name: {
      first: "Hoster",
      last: "Tully"
    }
  });

  return store.find('person', 1).then(function(person) {
    var name = person.get('name');

    name.set('first', 'Brynden');
    name.set('first', 'Hoster');

    ok(!name.get('isDirty'), "fragment is clean");
    ok(!person.get('isDirty'), "owner record is clean");
  });
});

test("restoring a `DS.hasOneFragment` fragment to its original state when the owner record was dirty returns the fragment to a clean state maintains the owner record's dirty state", function() {
  store.push('person', {
    id: 1,
    name: {
      first: "Jorah",
      last: "Mormont"
    }
  });

  return store.find('person', 1).then(function(person) {
    var name = person.get('name');

    // Dirty the owner record
    person.set('title', 'Lord Commander');

    name.set('first', 'Jeor');
    name.set('first', 'Jorah');

    ok(!name.get('isDirty'), "fragment is clean");
    ok(person.get('isDirty'), "owner record is still dirty");
  });
});

test("rolling back the owner record returns a `DS.hasOneFragment` fragment and owner record to a clean state", function() {
  store.push('person', {
    id: 1,
    name: {
      first: "Catelyn",
      last: "Stark"
    }
  });

  return store.find('person', 1).then(function(person) {
    var name = person.get('name');

    name.set('last', 'Tully');

    person.rollback();

    ok(!name.get('isDirty'), "fragment is clean");
    ok(!person.get('isDirty'), "owner record is clean");
  });
});

test("a record can be rolled back multiple times", function() {
  store.push('person', {
    id: 1,
    name: {
      first: "Arya",
      last: "Stark"
    }
  });

  return store.find('person', 1).then(function(person) {
    var name = person.get('name');

    name.set('last', '');
    person.rollback();

    equal(name.get('last'), 'Stark', "fragment has correct values");
    ok(!name.get('isDirty'), "fragment is clean");
    ok(!person.get('isDirty'), "owner record is clean");

    name.set('last', '');
    person.rollback();

    equal(name.get('last'), 'Stark', "fragment has correct values");
    ok(!name.get('isDirty'), "fragment is clean");
    ok(!person.get('isDirty'), "owner record is clean");
  });
});

test("rolling back a `DS.hasOneFragment` fragment returns the fragment and the owner record to a clean state", function() {
  store.push('person', {
    id: 1,
    name: {
      first: "Sansa",
      last: "Stark"
    }
  });

  return store.find('person', 1).then(function(person) {
    var name = person.get('name');

    // Dirty the fragment
    name.set('last', 'Lannister');

    name.rollback();

    ok(!name.get('isDirty'), "fragment is clean");
    ok(!person.get('isDirty'), "owner record is clean");
  });
});

test("rolling back a `DS.hasOneFragment` fragment when the owner record is dirty returns the fragment to a clean state and maintains the owner record's dirty state", function() {
  store.push('person', {
    id: 1,
    name: {
      first: "Sansa",
      last: "Stark"
    }
  });

  return store.find('person', 1).then(function(person) {
    var name = person.get('name');

    // Dirty the owner record and fragment
    person.set('title', 'Heir to Winterfell');
    name.set('last', 'Lannister');

    name.rollback();

    ok(!name.get('isDirty'), "fragment is clean");
    ok(person.get('isDirty'), "owner record is still dirty");
  });
});

test("a `DS.hasOneFragment` fragment property that is set to null can be rolled back", function() {
  pushPerson(1);

  return store.find('person', 1).then(function(person) {
    var name = person.get('name');

    person.set('name', null);

    ok(person.get('isDirty'), "owner record is dirty");

    person.rollback();

    deepEqual(person.get('name'), name, "property is restored");
    ok(!name.get('isDirty'), "fragment is clean");
    ok(!person.get('isDirty'), "owner record is clean");
  });
});

test("a `DS.hasOneFragment` fragment property that is null can be rolled back", function() {
  store.push('person', { id: 1, });

  return store.find('person', 1).then(function(person) {
    var name = person.get('name');

    equal(name, null, "property is null");

    person.set('name', store.createFragment('name', { first: 'Rob', last: 'Stark' }));

    ok(person.get('isDirty'), "owner record is dirty");

    person.rollback();

    equal(person.get('name'), null, "property is null again");
    ok(!person.get('isDirty'), "owner record is clean");
  });
});

test("adding a fragment to a fragment array dirties the fragment array and owner record", function() {
  pushPerson(1);

  return store.find('person', 1).then(function(person) {
    var addresses = person.get('addresses');

    addresses.createFragment('address', {
      street: "1 Dungeon Cell",
      city: "King's Landing",
      region: "Crownlands",
      country: "Westeros"
    });

    ok(addresses.get('isDirty'), "fragment array is dirty");
    ok(person.get('isDirty'), "owner record is dirty");
  });
});

test("removing a fragment from a fragment array dirties the fragment array and owner record", function() {
  pushPerson(1);

  return store.find('person', 1).then(function(person) {
    var addresses = person.get('addresses');

    addresses.removeObject(addresses.get('firstObject'));

    ok(addresses.get('isDirty'), "fragment array is dirty");
    ok(person.get('isDirty'), "owner record is dirty");
  });
});

test("reordering a fragment array dirties the fragment array and owner record", function() {
  pushPerson(1);

  return store.find('person', 1).then(function(person) {
    var addresses = person.get('addresses');
    var length = addresses.get('length');

    var address = addresses.popObject();
    addresses.unshiftObject(address);

    equal(addresses.get('length'), length, "fragment array length is maintained");
    ok(addresses.get('isDirty'), "fragment array is dirty");
    ok(person.get('isDirty'), "owner record is dirty");
  });
});

test("restoring a fragment array to its original order returns the fragment array owner record to a clean state", function() {
  pushPerson(1);

  return store.find('person', 1).then(function(person) {
    var addresses = person.get('addresses');

    var address = addresses.popObject();
    addresses.pushObject(address);

    ok(!addresses.get('isDirty'), "fragment array is clean");
    ok(!person.get('isDirty'), "owner record is clean");
  });
});

test("restoring a fragment array to its original order when the owner record was dirty returns the fragment array to a clean state and maintains the owner record's dirty state", function() {
  pushPerson(1);

  return store.find('person', 1).then(function(person) {
    var addresses = person.get('addresses');

    // Dirty the owner record
    person.set('title', 'Hand of the King');

    var address = addresses.popObject();
    addresses.pushObject(address);

    ok(!addresses.get('isDirty'), "fragment array is clean");
    ok(person.get('isDirty'), "owner record is still dirty");
  });
});

test("changing a `DS.hasManyFragments` fragment property dirties the fragment, fragment array, and owner record", function() {
  pushPerson(1);

  return store.find('person', 1).then(function(person) {
    var addresses = person.get('addresses');
    var address = addresses.get('firstObject');

    address.set('street', '2 Sky Cell');

    ok(address.get('isDirty'), "fragment is dirty");
    ok(addresses.get('isDirty'), "fragment array is dirty");
    ok(person.get('isDirty'), "owner record is dirty");
  });
});

test("restoring a `DS.hasManyFragments` fragment to its original state returns the fragment, fragment array, and owner record to a clean state", function() {
  pushPerson(1);

  return store.find('person', 1).then(function(person) {
    var addresses = person.get('addresses');
    var address = addresses.get('firstObject');

    address.set('street', '2 Sky Cell');
    address.set('street', '1 Sky Cell');

    ok(!address.get('isDirty'), "fragment is clean");
    ok(!addresses.get('isDirty'), "fragment array is clean");
    ok(!person.get('isDirty'), "owner record is clean");
  });
});

test("restoring a `DS.hasManyFragments` fragment to its original state when the fragment array was dirty returns the fragment to a clean state and maintains the fragment array and owner record's dirty state", function() {
  pushPerson(1);

  return store.find('person', 1).then(function(person) {
    var addresses = person.get('addresses');
    var address = addresses.get('firstObject');

    // Dirty the record array
    addresses.popObject();

    address.set('street', '2 Sky Cell');
    address.set('street', '1 Sky Cell');

    ok(!address.get('isDirty'), "fragment is clean");
    ok(addresses.get('isDirty'), "fragment array is still dirty");
    ok(person.get('isDirty'), "owner record is dirty");
  });
});

test("restoring a `DS.hasManyFragments` fragment to its original state when the owner record was dirty returns the fragment and fragment array to a clean state maintains the owner record's dirty state", function() {
  pushPerson(1);

  return store.find('person', 1).then(function(person) {
    var addresses = person.get('addresses');
    var address = addresses.get('firstObject');

    address.set('street', '2 Sky Cell');
    address.set('street', '1 Sky Cell');

    // Dirty the owner record
    person.set('title', 'Master of Coin');

    ok(!address.get('isDirty'), "fragment is clean");
    ok(!addresses.get('isDirty'), "fragment array is clean");
    ok(person.get('isDirty'), "owner record is still dirty");
  });
});

test("rolling back the owner record returns all `DS.hasManyFragments` fragments, the fragment array, and owner record to a clean state", function() {
  pushPerson(1);

  return store.find('person', 1).then(function(person) {
    var addresses = person.get('addresses');
    var address = addresses.get('firstObject');

    // Dirty the owner record, fragment array, and a fragment
    person.set('title', 'Warden of the West');
    addresses.popObject();
    address.set('street', '2 Sky Cell');

    person.rollback();

    ok(!address.get('isDirty'), "fragment is clean");
    ok(!addresses.get('isDirty'), "fragment array is clean");
    ok(!person.get('isDirty'), "owner record is clean");
  });
});

test("rolling back the owner record returns all `DS.hasManyFragments` primitive values, the array, and the owner record to a clean state", function() {
  pushPerson(1);

  return store.find('person', 1).then(function(person) {
    var titles = person.get('titles');
    var values = titles.toArray();

    // Dirty the primitive array
    titles.popObject();
    titles.unshiftObject('Giant of Lannister');

    person.rollback();

    deepEqual(values, person.get('titles').toArray(), "primitive values are reset");
    ok(!titles.get('isDirty'), "fragment array is clean");
    ok(!person.get('isDirty'), "owner record is clean");
  });
});


test("rolling back a `DS.hasManyFragments` fragment array returns all fragments, the fragment array, and the owner record to a clean state", function() {
  pushPerson(1);

  return store.find('person', 1).then(function(person) {
    var addresses = person.get('addresses');
    var address = addresses.get('firstObject');

    // Dirty the fragment array and a fragment
    addresses.popObject();
    address.set('street', '2 Sky Cell');

    addresses.rollback();

    ok(!address.get('isDirty'), "fragment is clean");
    ok(!addresses.get('isDirty'), "fragment array is clean");
    ok(!person.get('isDirty'), "owner record is clean");
  });
});

test("rolling back a `DS.hasManyFragments` fragment array when the owner record is dirty returns all fragments and the fragment array to a clean state and retain's the owner record's dirty state", function() {
  pushPerson(1);

  return store.find('person', 1).then(function(person) {
    var addresses = person.get('addresses');
    var address = addresses.get('firstObject');

    // Dirty the owner record, fragment array, and a fragment
    person.set('title', 'Lord of the Westerlands');
    addresses.popObject();
    address.set('street', '2 Sky Cell');

    addresses.rollback();

    ok(!address.get('isDirty'), "fragment is clean");
    ok(!addresses.get('isDirty'), "fragment array is clean");
    ok(person.get('isDirty'), "owner record is still dirty");
  });
});

test("rolling back a `DS.hasManyFragments` fragment returns the fragment, fragment array, and owner record to a clean states", function() {
  pushPerson(1);

  return store.find('person', 1).then(function(person) {
    var addresses = person.get('addresses');
    var address = addresses.get('firstObject');

    // Dirty a fragment
    address.set('street', '2 Sky Cell');

    address.rollback();

    ok(!address.get('isDirty'), "fragment is clean");
    ok(!addresses.get('isDirty'), "fragment array is clean");
    ok(!person.get('isDirty'), "owner record is clean");
  });
});

test("rolling back a `DS.hasManyFragments` fragment when the fragment array is dirty returns the fragment to a clean state and maintains the fragment array and owner record's dirty state", function() {
  pushPerson(1);

  return store.find('person', 1).then(function(person) {
    var addresses = person.get('addresses');
    var address = addresses.get('firstObject');

    // Dirty fragment array, and a fragment
    addresses.popObject();
    address.set('street', '2 Sky Cell');

    address.rollback();

    ok(!address.get('isDirty'), "fragment is clean");
    ok(addresses.get('isDirty'), "fragment array is still dirty");
    ok(person.get('isDirty'), "owner record is still dirty");
  });
});

test("rolling back a `DS.hasManyFragments` fragment when the owner record is dirty returns the fragment and fragment array to a clean state and maintains the owner record's dirty state", function() {
  pushPerson(1);

  return store.find('person', 1).then(function(person) {
    var addresses = person.get('addresses');
    var address = addresses.get('firstObject');

    // Dirty the owner record, and a fragment
    person.set('title', 'Lord of Casterly Rock');
    address.set('street', '2 Sky Cell');

    address.rollback();

    ok(!address.get('isDirty'), "fragment is clean");
    ok(!addresses.get('isDirty'), "fragment array is clean");
    ok(person.get('isDirty'), "owner record is still dirty");
  });
});

test("a `DS.hasManyFragments` fragment property that is set to null can be rolled back", function() {
  pushPerson(1);

  return store.find('person', 1).then(function(person) {
    var addresses = person.get('addresses');

    person.set('addresses', null);

    ok(person.get('isDirty'), "owner record is dirty");

    person.rollback();

    equal(person.get('addresses'), addresses, "property is restored");
    ok(!addresses.get('isDirty'), "fragment array is clean");
    ok(!person.get('isDirty'), "owner record is clean");
  });
});

test("a `DS.hasManyFragments` fragment property that is null can be rolled back", function() {
  store.push('person', { id: 1, });

  return store.find('person', 1).then(function(person) {
    var addresses = person.get('addresses');

    equal(addresses, null, "property is null");

    person.set('addresses', [
      store.createFragment('address', {
        street: "1 Spear Tower",
        city: "Sun Spear",
        region: "Dorne",
        country: "Westeros"
      })
    ]);

    ok(person.get('isDirty'), "owner record is dirty");

    person.rollback();

    equal(person.get('addresses'), null, "property is null again");
    ok(!person.get('isDirty'), "owner record is clean");
  });
});
