import Ember from 'ember';
import MF from 'ember-data-model-fragments';
import DS from 'ember-data';
import { test } from 'qunit';
import moduleForAcceptance from '../helpers/module-for-acceptance';
var store, adapter, application;

moduleForAcceptance("integration - Persistence", {
  beforeEach: function() {
    application = this.application;
    store       = application.__container__.lookup('service:store');
    adapter     = store.get('defaultAdapter');
    //expectNoDeprecation();
  },

  afterEach: function() {
    store = null;
    adapter = null;
    application = null;
  }
});

test("persisting the owner record in a clean state maintains clean state", function(assert) {
  Ember.run(() => {
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

    adapter.updateRecord = function() {
      return Ember.RSVP.resolve();
    };

    return store.find('person', 1).then(function(person) {
      return person.save();
    }).then(function(person) {
      var name = person.get('name');
      var addresses = person.get('addresses');

      assert.ok(!name.get('hasDirtyAttributes'), "fragment is clean");
      assert.ok(!addresses.isAny('hasDirtyAttributes'), "all fragment array fragments are clean");
      assert.ok(!addresses.get('hasDirtyAttributes'), "fragment array is clean");
      assert.ok(!person.get('hasDirtyAttributes'), "owner record is clean");
    });
  });
});

test("persisting the owner record when a fragment is dirty moves owner record, fragment array, and all fragments into clean state", function(assert) {
  Ember.run(() => {
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

    adapter.updateRecord = function() {
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

      assert.equal(name.get('first'), 'Arya', "change is persisted");
      assert.equal(address.get('street'), '1 Godswood', "fragment array change is persisted");
      assert.ok(!name.get('hasDirtyAttributes'), "fragment is clean");
      assert.ok(!addresses.isAny('hasDirtyAttributes'), "all fragment array fragments are clean");
      assert.ok(!addresses.get('hasDirtyAttributes'), "fragment array is clean");
      assert.ok(!person.get('hasDirtyAttributes'), "owner record is clean");
    });
  });
});

test("persisting a new owner record moves the owner record, fragment array, and all fragments into clean state", function(assert) {
  Ember.run(() => {
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

    adapter.createRecord = function() {
      var payload = Ember.copy(data, true);

      payload.id = 3;

      return Ember.RSVP.resolve(payload);
    };

    return person.save().then(function(person) {
      var name = person.get('name');
      var addresses = person.get('addresses');

      assert.ok(!name.get('hasDirtyAttributes'), "fragment is clean");
      assert.ok(!addresses.isAny('hasDirtyAttributes'), "all fragment array fragments are clean");
      assert.ok(!addresses.get('hasDirtyAttributes'), "fragment array is clean");
      assert.ok(!person.get('hasDirtyAttributes'), "owner record is clean");
    });
  });
});

test("a new record can be persisted with null fragments", function(assert) {
  Ember.run(() => {
    var person = store.createRecord('person');

    assert.equal(person.get('name'), null, "fragment property is null");
    assert.equal(person.get('hobbies'), null, "fragment array property is null");

    adapter.createRecord = function() {
      var payload = { id: 1 };

      return Ember.RSVP.resolve(payload);
    };

    return person.save().then(function(person) {
      assert.equal(person.get('name'), null, "fragment property is still null");
      assert.equal(person.get('hobbies'), null, "fragment array property is still null");
      assert.ok(!person.get('hasDirtyAttributes'), "owner record is clean");
    });
  });
});

test("the adapter can update fragments on save", function(assert) {
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

  Ember.run(() => {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: data
      }
    });

    adapter.updateRecord = function() {
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

      assert.ok(!name.get('hasDirtyAttributes'), "fragment is clean");
      assert.ok(!addresses.isAny('hasDirtyAttributes'), "all fragment array fragments are clean");
      assert.ok(!addresses.get('hasDirtyAttributes'), "fragment array is clean");
      assert.ok(!person.get('hasDirtyAttributes'), "owner record is clean");
      assert.equal(name.get('first'), 'Ned', "fragment correctly updated");
      assert.equal(addresses.get('firstObject.street'), '1 Godswood', "fragment array fragment correctly updated");
    });
  });
});

test("existing fragments are updated on save", function(assert) {
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

  Ember.run(() => {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: data
      }
    });

    adapter.updateRecord = function() {
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
      assert.equal(name.get('first'), 'Ned', "fragment correctly updated");
      assert.equal(address.get('street'), '1 Red Keep', "fragment array fragment correctly updated");
      assert.equal(addresses.get('lastObject.street'), '1 Godswood', "fragment array fragment correctly updated");
      assert.equal(addresses.get('length'), 2, "fragment array fragment correctly updated");
    });
  });
});

test("newly created fragments are updated on save", function(assert) {
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

  Ember.run(() => {
    adapter.createRecord = function() {
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
      assert.equal(name.get('first'), 'Ned', "fragment correctly updated");
      assert.equal(address.get('street'), '1 Red Keep', "fragment array fragment correctly updated");
      assert.equal(addresses.get('lastObject.street'), '1 Godswood', "fragment array fragment correctly updated");
      assert.equal(addresses.get('length'), 2, "fragment array fragment correctly updated");
    });
  });
});

test("the adapter can update fragments on reload", function(assert) {
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

  Ember.run(() => {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: data
      }
    });

    adapter.findRecord = function() {
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

      assert.equal(name.get('first'), 'Bran', "fragment correctly updated");
      assert.equal(addresses.get('firstObject.street'), '1 Broken Tower', "fragment array fragment correctly updated");
    });
  });
});

/*
  Currently in certain annoying cases in Ember, including aliases or proxies that are actively observed,
  CPs are consumed as soon as they are changed. If we are not careful, this can cause infinite loops when
  updating existing fragment data
*/
test("the adapter can update fragments without infinite loops when CPs are eagerly consumed", function(assert) {
  var data = {
    name: {
      first: "Brandon",
      last: "Stark"
    }
  };

  Ember.run(() => {
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

      assert.equal(person.get('name.first'), 'Brandon');
    });
  });
});

// TODO: The data in the adapter response is not actually changing here, which
// means that the property actually _shouldn't_ be notified. Doing so requires
// value diffing of deserialized model data, which means either saving a copy of
// the data before giving it to the fragment
test("fragment array properties are notified on save", function(assert) {
  // The extra assertion comes from deprecation checking
  assert.expect(2);

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
      assert.ok(true, "The array change was observed");
    })
  });

  Ember.run(() => {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: data
      }
    });

    adapter.updateRecord = function() {
      var payload = Ember.copy(data, true);

      payload.id = 1;

      return Ember.RSVP.resolve(payload);
    };

    return store.find('person', 1).then(function(person) {
      PersonObserver.create({ person: person });
      return person.save();
    });
  });
});

test("fragment array properties are notifed on reload", function(assert) {
  // The extra assertion comes from deprecation checking
  assert.expect(2);

  var Army = DS.Model.extend({
    name     : DS.attr('string'),
    soldiers : MF.array()
  });

  application.register('model:army', Army);

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
      assert.equal(this.get('army.soldiers.length'), 2, "The array change to was observed");
    })
  });

  Ember.run(() => {
    store.push({
      data: {
        type: 'army',
        id: 1,
        attributes: data
      }
    });

    adapter.findRecord = function() {
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
});
