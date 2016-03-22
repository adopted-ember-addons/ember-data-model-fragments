import Ember from 'ember';
import DS from 'ember-data';
import MF from 'model-fragments';
import { test } from 'qunit';
import moduleForAcceptance from '../helpers/module-for-acceptance';
import getOwner from '../helpers/get-owner';
import Name from 'dummy/models/name';

var store, owner;
var all = Ember.RSVP.all;

moduleForAcceptance("unit - `MF.fragment` property", {
  beforeEach: function() {
    owner = getOwner(this);
    store = owner.lookup('service:store');
    //expectNoDeprecation();
  },

  afterEach: function() {
    owner = null;
    store = null;
  }
});

test("object literals are converted to instances of `MF.Fragment`", function(assert) {
  Ember.run(() => {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          name: {
            first: "Tyrion",
            last: "Lannister"
          }
        }
      }
    });

    return store.find('person', 1).then(function(person) {
      assert.ok(person.get('name') instanceof Name, "name property is an `MF.Fragment` instance");

      assert.equal(person.get('name.first'), 'Tyrion', "nested properties have original value");
    });
  });
});

test("a fragment can be created through the store and set", function(assert) {
  Ember.run(() => {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {}
      }
    });

    return store.find('person', 1).then(function(person) {
      var name = store.createFragment('name', {
        first: "Davos",
        last: "Seaworth"
      });

      person.set('name', name);

      assert.equal(person.get('name.first'), 'Davos', "new fragment is correctly set");
    });
  });
});

test("setting to a non-fragment or object literal throws an error", function(assert) {
  Ember.run(() => {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {}
      }
    });

    return store.find('person', 1).then(function(person) {
      assert.throws(function() {
        person.set('name', store.createRecord('person'));
      }, "error is thrown when setting non-fragment");
    });
  });
});

test("setting fragments from other records throws an error", function(assert) {
  Ember.run(() => {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          name: {
            first: "Roose",
            last: "Bolton"
          }
        }
      }
    });

    store.push({
      data: {
        type: 'person',
        id: 2,
        attributes: {}
      }
    });

    return all([
      store.find('person', 1),
      store.find('person', 2)
    ]).then(function(people) {
      assert.throws(function() {
        people[1].set('name', people[0].get('name'));
      }, "error is thrown when setting to a fragment of another record");
    });
  });
});

test("null values are allowed", function(assert) {
  Ember.run(() => {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          name: null
        }
      }
    });

    return store.find('person', 1).then(function(person) {
      assert.equal(person.get('name'), null, "property is null");
    });
  });
});

test("setting to null is allowed", function(assert) {
  Ember.run(() => {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          name: {
            first: "Barristan",
            last: "Selmy"
          }
        }
      }
    });

    return store.find('person', 1).then(function(person) {
      person.set('name', null);
      assert.equal(person.get('name'), null, "property is null");
    });
  });
});

test("fragments are created from object literals when creating a record", function(assert) {
  Ember.run(() => {
    var name = {
      first: 'Balon',
      last: 'Greyjoy'
    };

    var person = store.createRecord('person', {
      name: name
    });

    assert.ok(person.get('name') instanceof MF.Fragment, "a `MF.Fragment` instance is created");
    assert.equal(person.get('name.first'), name.first, "fragment has correct values");
  });
});

test("setting a fragment to an object literal creates a new fragment", function(assert) {
  var name = {
    first: 'Asha',
    last: 'Greyjoy'
  };

  Ember.run(() => {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          name: null
        }
      }
    });

    return store.find('person', 1).then(function(person) {
      person.set('name', name);

      assert.ok(person.get('name') instanceof MF.Fragment, "a `MF.Fragment` instance is created");
      assert.equal(person.get('name.first'), name.first, "fragment has correct values");
    });
  });
});

test("setting a fragment to an object literal reuses an existing fragment", function(assert) {
  var newName = {
    first: 'Reek',
    last: null
  };

  Ember.run(() => {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          name: {
            first: 'Theon',
            last: 'Greyjoy'
          }
        }
      }
    });

    return store.find('person', 1).then(function(person) {
      var name = person.get('name');

      person.set('name', newName);

      assert.equal(name, person.get('name'), "fragment instances are reused");
      assert.equal(person.get('name.first'), newName.first, "fragment has correct values");
    });
  });
});

test("fragments can have default values", function(assert) {
  Ember.run(() => {
    var defaultValue = {
      first: "Iron",
      last: "Victory"
    };

    var Ship = DS.Model.extend({
      name: MF.fragment("name", { defaultValue: defaultValue }),
    });

    owner.register('model:ship', Ship);

    var ship = store.createRecord('ship');

    assert.equal(ship.get('name.first'), defaultValue.first, "the default value is used when the value has not been specified");

    ship.set('name', null);
    assert.equal(ship.get('name'), null, "the default value is not used when the value is set to null");

    ship = store.createRecord('ship', { name: null });
    assert.equal(ship.get('name'), null, "the default value is not used when the value is initialized to null");
  });
});

test("fragment default values can be functions", function(assert) {
  Ember.run(() => {
    var defaultValue = {
      first: "Oath",
      last: "Keeper"
    };

    var Sword = DS.Model.extend({
      name: MF.fragment("name", { defaultValue: function() { return defaultValue; } }),
    });

    owner.register('model:sword', Sword);

    var sword = store.createRecord('sword');

    assert.equal(sword.get('name.first'), defaultValue.first, "the default value is correct");
  });
});

test("destroy a fragment which was set to null", function(assert) {
  return Ember.run(() => {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          name: {
            first: "Barristan",
            last: "Selmy"
          }
        }
      }
    });

    return store.find('person', 1).then(function(person) {
      var name = person.get('name');
      person.set('name', null);

      person.destroy();

      Ember.run.schedule('destroy', function() {
        assert.ok(person.get('isDestroying'), "the model is being destroyed");
        assert.ok(name.get('isDestroying'), "the fragment is being destroyed");
      });
    });
  });
});

test("destroy the old and new fragment value", function(assert) {
  return Ember.run(() => {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          name: {
            first: "Barristan",
            last: "Selmy"
          }
        }
      }
    });

    return store.find('person', 1).then(function(person) {
      var oldName = person.get('name');
      var newName = store.createFragment('name');
      person.set('name', newName);

      assert.ok(!oldName.get('isDestroying'), "don't destroy the old fragment yet because we could rollback");

      person.destroy();

      Ember.run.schedule('destroy', function() {
        assert.ok(person.get('isDestroying'), "the model is being destroyed");
        assert.ok(oldName.get('isDestroying'), "the old fragment is being destroyed");
        assert.ok(newName.get('isDestroying'), "the new fragment is being destroyed");
      });
    });
  });
});
