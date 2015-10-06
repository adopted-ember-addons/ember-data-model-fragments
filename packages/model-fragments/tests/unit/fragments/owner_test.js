var env, store, Person, Name;
var all = Ember.RSVP.all;

QUnit.module("unit/fragments - DS.fragmentOwner", {
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

    expectNoDeprecation();
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

test("using a fragment owner property on a non-fragment throws an error", function() {
  Person.reopen({
    owner: DS.fragmentOwner()
  });

  var person = store.createRecord('person');

  throws(function() {
    person.get('owner');
  }, /Fragment owner properties can only be used on fragments/, "getting fragment owner on non-fragment throws an error");
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

test("setting a fragment property to `null` releases it of its owner record", function() {
  store.push({
    type: 'person',
    id: 1,
    attributes: {
      name: {
        first: 'Sandor',
        last: 'Clegane'
      }
    }
  });

  return store.find('person', 1).then(function(person) {
    var name = person.get('name');

    person.set('name', null);

    ok(!name.get('person'), "fragment owner is cleared");

    var newPerson = store.createRecord('person', {
      name: name
    });

    equal(name.get('person'), newPerson, "fragment owner is set");
  });
});

test("removing a fragment from an array property to `null` releases it of its owner record", function() {
  Person.reopen({
    names: DS.hasManyFragments('name')
  });

  store.push({
    type: 'person',
    id: 1,
    attributes: {
      names: [
        {
          first: 'Jaqen ',
          last: 'H\'ghar'
        },
        {
          first: 'The',
          last: 'Alchemist'
        },
        {
          first: '',
          last: ''
        }
      ]
    }
  });

  return store.find('person', 1).then(function(person) {
    var names = person.get('names');
    var name1 = names.objectAt(0);
    var name2 = names.objectAt(1);
    var name3 = names.objectAt(2);

    names.removeObject(name1);
    names.replace(0, 2, []);

    ok(!name1.get('person'), "fragment owner is cleared (1)");
    ok(!name2.get('person'), "fragment owner is cleared (2)");
    ok(!name3.get('person'), "fragment owner is cleared (3)");

    var newPerson = store.createRecord('person', {
      names: [ name1 ]
    });

    equal(name1.get('person'), newPerson, "fragment owner is set");
  });
});
