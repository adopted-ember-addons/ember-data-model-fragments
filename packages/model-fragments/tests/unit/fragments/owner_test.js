var env, store, Person, Name;
var all = Ember.RSVP.all;

module("unit/fragments - DS.fragmentOwner", {
  setup: function() {
    Person = DS.Model.extend({
      name: DS.hasOneFragment("name"),
    });

    Name = DS.ModelFragment.extend({
      first : DS.attr("string"),
      last  : DS.attr("string"),
      person: DS.fragmentOwner()
    });

    env = setupEnv({
      person: Person,
      name: Name
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

test("fragments can reference their owner record", function() {
  store.push({
    type: 'person',
    id: 1,
    attributes: {
      name: {
        first: "Samwell",
        last: "Tarly"
      }
    }
  });

  return store.find('person', 1).then(function(person) {
    var name = person.get('name');

    equal(name.get('person'), person, "`DS.fragmentOwner` property is reference to the owner record");
  });
});

test("attempting to change a fragment's owner record throws an error", function() {
  store.push({
    type: 'person',
    id: 1,
    attributes: {
      name: {
        first: "Samwell",
        last: "Tarly"
      }
    }
  });

  store.push({
    type: 'person',
    id: 2,
    attributes: {
      name: {
        first: "Samwell",
        last: "Tarly"
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
