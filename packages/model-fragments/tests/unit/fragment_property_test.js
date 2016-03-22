var env, store, Person, Name;
var all = Ember.RSVP.all;

QUnit.module("unit - `MF.fragment` property", {
  setup: function() {
    Person = DS.Model.extend({
      name: MF.fragment('name'),
      title: DS.attr('string')
    });

    Name = MF.Fragment.extend({
      first: DS.attr('string'),
      last: DS.attr('string')
    });

    env = setupEnv({
      person: Person,
      name: Name
    });

    store = env.store;

    ok(true); // expectNoDeprecation();
  },

  teardown: function() {
    env = null;
    store = null;
    Person = null;
    Name = null;
  }
});

test("object literals are converted to instances of `MF.Fragment`", function() {
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
    ok(person.get('name') instanceof Name, "name property is an `MF.Fragment` instance");

    equal(person.get('name.first'), 'Tyrion', "nested properties have original value");
  });
});

test("a fragment can be created through the store and set", function() {
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

    equal(person.get('name.first'), 'Davos', "new fragment is correctly set");
  });
});

test("setting to a non-fragment or object literal throws an error", function() {
  store.push({
    data: {
      type: 'person',
      id: 1,
      attributes: {}
    }
  });

  return store.find('person', 1).then(function(person) {
    throws(function() {
      person.set('name', store.createRecord('person'));
    }, "error is thrown when setting non-fragment");
  });
});

test("setting fragments from other records throws an error", function() {
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
    throws(function() {
      people[1].set('name', people[0].get('name'));
    }, "error is thrown when setting to a fragment of another record");
  });
});

test("null values are allowed", function() {
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
    equal(person.get('name'), null, "property is null");
  });
});

test("setting to null is allowed", function() {
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
    equal(person.get('name'), null, "property is null");
  });
});

test("fragments are created from object literals when creating a record", function() {
  Ember.run(function() {
    var name = {
      first: 'Balon',
      last: 'Greyjoy'
    };

    var person = store.createRecord('person', {
      name: name
    });

    ok(person.get('name') instanceof MF.Fragment, "a `MF.Fragment` instance is created");
    equal(person.get('name.first'), name.first, "fragment has correct values");
  });
});

test("setting a fragment to an object literal creates a new fragment", function() {
  var name = {
    first: 'Asha',
    last: 'Greyjoy'
  };

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

    ok(person.get('name') instanceof MF.Fragment, "a `MF.Fragment` instance is created");
    equal(person.get('name.first'), name.first, "fragment has correct values");
  });
});

test("setting a fragment to an object literal reuses an existing fragment", function() {
  var newName = {
    first: 'Reek',
    last: null
  };

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

    equal(name, person.get('name'), "fragment instances are reused");
    equal(person.get('name.first'), newName.first, "fragment has correct values");
  });
});

test("fragments can have default values", function() {
  Ember.run(function() {
    var defaultValue = {
      first: "Iron",
      last: "Victory"
    };

    var Ship = DS.Model.extend({
      name: MF.fragment("name", { defaultValue: defaultValue }),
    });

    env.registry.register('model:ship', Ship);

    var ship = store.createRecord('ship');

    equal(ship.get('name.first'), defaultValue.first, "the default value is used when the value has not been specified");

    ship.set('name', null);
    equal(ship.get('name'), null, "the default value is not used when the value is set to null");

    ship = store.createRecord('ship', { name: null });
    equal(ship.get('name'), null, "the default value is not used when the value is initialized to null");
  });
});

test("fragment default values can be functions", function() {
  Ember.run(function() {
    var defaultValue = {
      first: "Oath",
      last: "Keeper"
    };

    var Sword = DS.Model.extend({
      name: MF.fragment("name", { defaultValue: function() { return defaultValue; } }),
    });

    env.registry.register('model:sword', Sword);

    var sword = store.createRecord('sword');

    equal(sword.get('name.first'), defaultValue.first, "the default value is correct");
  });
});

test("destroy a fragment which was set to null", function() {
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
      ok(person.get('isDestroying'), "the model is being destroyed");
      ok(name.get('isDestroying'), "the fragment is being destroyed");
    });
  });
});

test("destroy the old and new fragment value", function() {
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

    ok(!oldName.get('isDestroying'), "don't destroy the old fragment yet because we could rollback");

    person.destroy();

    Ember.run.schedule('destroy', function() {
      ok(person.get('isDestroying'), "the model is being destroyed");
      ok(oldName.get('isDestroying'), "the old fragment is being destroyed");
      ok(newName.get('isDestroying'), "the new fragment is being destroyed");
    });
  });
});
