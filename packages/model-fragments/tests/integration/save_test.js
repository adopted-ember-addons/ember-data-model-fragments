var env, store, Person, Name, Address, Hobby, Army;

QUnit.module("integration - Persistence", {
  setup: function() {
    Person = DS.Model.extend({
      name: MF.fragment('name'),
      addresses: MF.fragmentArray('address'),
      hobbies: MF.fragmentArray("hobby", { defaultValue: null })
    });

    Name = MF.Fragment.extend({
      first: DS.attr('string'),
      last: DS.attr('string')
    });

    Address = MF.Fragment.extend({
      street: DS.attr('string'),
      city: DS.attr('string'),
      region: DS.attr('string'),
      country : DS.attr('string')
    });

    Hobby = MF.Fragment.extend({
      name: DS.attr('string')
    });

    Army = DS.Model.extend({
      name     : DS.attr('string'),
      soldiers : MF.array()
    });

    env = setupEnv({
      person: Person,
      name: Name,
      address: Address,
      hobby: Hobby,
      army: Army
    });

    store = env.store;

    ok(true); // expectNoDeprecation();
  },

  teardown: function() {
    env = null;
    store = null;
    Name = null;
    Person = null;
    Address = null;
    Hobby = null;
    Army = null;
  }
});

test("persisting the owner record changes the fragment state to non-new", function() {
  var data = {
    name: {
      first: "Viserys",
      last: "Targaryen"
    }
  };

  var person = store.createRecord('person');

  person.set('name', store.createFragment('name', data.name));

  env.adapter.createRecord = function() {
    var payload = Ember.copy(data, true);

    payload.id = 3;

    return Ember.RSVP.resolve(payload);
  };

  return person.save().then(function(person) {
    ok(!person.get('name.isNew'), "fragments are not new after save");
  });
});

test("persisting the owner record in a clean state maintains clean state", function() {
  store.push({
    data: {
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
    }
  });

  env.adapter.updateRecord = function() {
    return Ember.RSVP.resolve();
  };

  return store.find('person', 1).then(function(person) {
    return person.save();
  }).then(function(person) {
    var name = person.get('name');
    var addresses = person.get('addresses');

    ok(!name.get('hasDirtyAttributes'), "fragment is clean");
    ok(!addresses.isAny('hasDirtyAttributes'), "all fragment array fragments are clean");
    ok(!addresses.get('hasDirtyAttributes'), "fragment array is clean");
    ok(!person.get('hasDirtyAttributes'), "owner record is clean");
  });
});

test("persisting the owner record when a fragment is dirty moves owner record, fragment array, and all fragments into clean state", function() {
  store.push({
    data: {
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
    }
  });

  env.adapter.updateRecord = function() {
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

    equal(name.get('first'), 'Arya', "change is persisted");
    equal(address.get('street'), '1 Godswood', "fragment array change is persisted");
    ok(!name.get('hasDirtyAttributes'), "fragment is clean");
    ok(!addresses.isAny('hasDirtyAttributes'), "all fragment array fragments are clean");
    ok(!addresses.get('hasDirtyAttributes'), "fragment array is clean");
    ok(!person.get('hasDirtyAttributes'), "owner record is clean");
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

  env.adapter.createRecord = function() {
    var payload = Ember.copy(data, true);

    payload.id = 3;

    return Ember.RSVP.resolve(payload);
  };

  return person.save().then(function(person) {
    var name = person.get('name');
    var addresses = person.get('addresses');

    ok(!name.get('hasDirtyAttributes'), "fragment is clean");
    ok(!addresses.isAny('hasDirtyAttributes'), "all fragment array fragments are clean");
    ok(!addresses.get('hasDirtyAttributes'), "fragment array is clean");
    ok(!person.get('hasDirtyAttributes'), "owner record is clean");
  });
});

test("a new record can be persisted with null fragments", function() {
  var person = store.createRecord('person');

  equal(person.get('name'), null, "fragment property is null");
  equal(person.get('hobbies'), null, "fragment array property is null");

  env.adapter.createRecord = function() {
    var payload = { id: 1 };

    return Ember.RSVP.resolve(payload);
  };

  return person.save().then(function(person) {
    equal(person.get('name'), null, "fragment property is still null");
    equal(person.get('hobbies'), null, "fragment array property is still null");
    ok(!person.get('hasDirtyAttributes'), "owner record is clean");
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
    data: {
      type: 'person',
      id: 1,
      attributes: data
    }
  });

  env.adapter.updateRecord = function() {
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

    ok(!name.get('hasDirtyAttributes'), "fragment is clean");
    ok(!addresses.isAny('hasDirtyAttributes'), "all fragment array fragments are clean");
    ok(!addresses.get('hasDirtyAttributes'), "fragment array is clean");
    ok(!person.get('hasDirtyAttributes'), "owner record is clean");
    equal(name.get('first'), 'Ned', "fragment correctly updated");
    equal(addresses.get('firstObject.street'), '1 Godswood', "fragment array fragment correctly updated");
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
    data: {
      type: 'person',
      id: 1,
      attributes: data
    }
  });

  env.adapter.updateRecord = function() {
    var payload = Ember.copy(data, true);

    payload.id = 1;
    payload.name.first = 'Ned';
    payload.addresses[0].street = '1 Godswood';
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
  }).then(function() {
    equal(name.get('first'), 'Ned', "fragment correctly updated");
    equal(address.get('street'), '1 Red Keep', "fragment array fragment correctly updated");
    equal(addresses.get('lastObject.street'), '1 Godswood', "fragment array fragment correctly updated");
    equal(addresses.get('length'), 2, "fragment array fragment correctly updated");
  });
});

test("newly created fragments are updated on save", function() {
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

  env.adapter.createRecord = function() {
    var payload = Ember.copy(data, true);

    payload.id = 1;
    payload.name.first = 'Ned';
    payload.addresses[0].street = '1 Godswood';
    payload.addresses.unshift({
      street: "1 Red Keep",
      city: "Kings Landing",
      region: "Crownlands",
      country: "Westeros"
    });

    return Ember.RSVP.resolve(payload);
  };

  var person = store.createRecord('person');
  var name = store.createFragment('name', Ember.copy(data.name));
  var address = store.createFragment('address', Ember.copy(data.addresses[0]));

  person.set('name', name);
  person.set('addresses', [ address ]);

  var addresses = person.get('addresses');

  return person.save().then(function() {
    equal(name.get('first'), 'Ned', "fragment correctly updated");
    equal(address.get('street'), '1 Red Keep', "fragment array fragment correctly updated");
    equal(addresses.get('lastObject.street'), '1 Godswood', "fragment array fragment correctly updated");
    equal(addresses.get('length'), 2, "fragment array fragment correctly updated");
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
    data: {
      type: 'person',
      id: 1,
      attributes: data
    }
  });

  env.adapter.findRecord = function() {
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

    equal(name.get('first'), 'Bran', "fragment correctly updated");
    equal(addresses.get('firstObject.street'), '1 Broken Tower', "fragment array fragment correctly updated");
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
    }
  };

  store.push({
    data: {
      type: 'person',
      id: 1,
      attributes: data
    }
  });

  return store.find('person', 1).then(function(person) {
    var personProxy = Ember.ObjectProxy.create({ content: person });

    Ember.addObserver(personProxy, 'name.first', function() {});
    personProxy.get('name.first');

    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: data
      }
    });

    equal(person.get('name.first'), 'Brandon');
  });
});

// TODO: The data in the adapter response is not actually changing here, which
// means that the property actually _shouldn't_ be notified. Doing so requires
// value diffing of deserialized model data, which means either saving a copy of
// the data before giving it to the fragment
test("fragment array properties are notified on save", function() {
  // The extra assertion comes from deprecation checking
  expect(2);

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
    observer: Ember.observer('person.addresses.[]', function() {
      ok(true, "The array change was observed");
    })
  });

  store.push({
    data: {
      type: 'person',
      id: 1,
      attributes: data
    }
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

test("fragment array properties are notifed on reload", function() {
  // The extra assertion comes from deprecation checking
  expect(2);

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
    data: {
      type: 'army',
      id: 1,
      attributes: data
    }
  });

  env.adapter.findRecord = function() {
    var payload = Ember.copy(data, true);

    payload.id = 1;
    payload.soldiers.shift();

    return Ember.RSVP.resolve(payload);
  };

  return store.find('army', 1).then(function(army) {
    ArmyObserver.create({ army: army });
    return army.reload();
  });
});

test('string array can be rolled back on failed save', function() {
  expect(3);

  var data = {
    name: "Golden Company",
    soldiers: [
      "Aegor Rivers",
      "Jon Connington",
      "Tristan Rivers"
    ]
  };

  store.push({
    data: {
      type: 'army',
      id: 1,
      attributes: data
    }
  });

  env.adapter.updateRecord = function() {
    return Ember.RSVP.reject({});
  };

  var army, soliders;
  return store.find('army', 1).then(function(_army) {
    army = _army;
    soliders = army.get('soldiers');
    soliders.pushObject('Lysono Maar');
    soliders.removeObject('Jon Connington');

    deepEqual(soliders.toArray(), ['Aegor Rivers', 'Tristan Rivers', 'Lysono Maar']);

    return army.save();
  }).catch(function() {
    army.rollbackAttributes();

    deepEqual(soliders.toArray(), ['Aegor Rivers', 'Jon Connington', 'Tristan Rivers']);
  });
});

test('existing fragments can be rolled back on failed save', function() {
  expect(3);

  var data = {
    name: {
      first: 'Eddard',
      last: 'Stark'
    },
    addresses: [
      {
        street: '1 Great Keep',
        city: 'Winterfell',
        region: 'North',
        country: 'Westeros'
      }
    ]
  };

  store.push({
    data: {
      type: 'person',
      id: 1,
      attributes: data
    }
  });

  env.adapter.updateRecord = function() {
    return Ember.RSVP.reject({});
  };

  var mrStark, name, address;

  return store.find('person', 1).then(function(person) {
    mrStark = person;

    name = mrStark.get('name');
    address = mrStark.get('addresses.firstObject');

    name.set('first', 'BadFirstName');
    name.set('last', 'BadLastName');
    address.set('street', 'BadStreet');

    return mrStark.save();
  }).catch(function() {
    mrStark.rollbackAttributes();

    equal(name.get('first') + ' ' + name.get('last'), 'Eddard Stark', 'fragment name rolled back');
    equal(address.get('street'), '1 Great Keep', 'fragment array fragment correctly rolled back');
  });
});
