var env, store, Person, Name;
var all = Ember.RSVP.all;

QUnit.module("unit - `MF.fragmentOwner` property", {
  setup: function() {
    Person = DS.Model.extend({
      name: MF.fragment('name'),
    });

    Name = MF.Fragment.extend({
      first: DS.attr('string'),
      last: DS.attr('string'),
      person: MF.fragmentOwner()
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

test("fragments can reference their owner record", function() {
  store.push({
    data: {
      type: 'person',
      id: 1,
      attributes: {
        name: {
          first: "Samwell",
          last: "Tarly"
        }
      }
    }
  });

  return store.find('person', 1).then(function(person) {
    var name = person.get('name');

    equal(name.get('person'), person, "fragment owner property is reference to the owner record");
  });
});

test("using a fragment owner property on a non-fragment throws an error", function() {
  Ember.run(function() {
    Person.reopen({
      owner: MF.fragmentOwner()
    });

    var person = store.createRecord('person');

    throws(function() {
      person.get('owner');
    }, /Fragment owner properties can only be used on fragments/, "getting fragment owner on non-fragment throws an error");
  });
});

test("attempting to change a fragment's owner record throws an error", function() {
  store.push({
    data: {
      type: 'person',
      id: 1,
      attributes: {
        name: {
          first: "Samwell",
          last: "Tarly"
        }
      }
    }
  });

  store.push({
    data: {
      type: 'person',
      id: 2,
      attributes: {
        name: {
          first: "Samwell",
          last: "Tarly"
        }
      }
    }
  });

  return all([
    store.find('person', 1),
    store.find('person', 2)
  ]).then(function(people) {
    var name = people[0].get('name');

    throws(function() {
      name.set('person', people[1]);
    }, "setting the owner property throws an error");
  });
});

test("fragment owner properties are notified of change", function() {
  store.push({
    data: {
      type: 'person',
      id: 1,
      attributes: {
        name: {
          first: "Jeyne",
          last: "Poole"
        }
      }
    }
  });

  return store.find('person', 1).then(function(person) {
    var name = store.createFragment('name', {
      first: 'Arya',
      last: 'Stark'
    });

    ok(!name.get('person'), "fragment owner property is null");

    person.set('name', name);

    equal(name.get('person'), person, "fragment owner property is updated");
  });
});
