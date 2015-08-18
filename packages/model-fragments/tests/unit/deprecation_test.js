var env, store, Person, Name, House;

QUnit.module("unit/fragments - Deprecations", {
  setup: function() {
    Person = DS.Model.extend({
      name: DS.hasOneFragment("name")
    });

    Name = DS.ModelFragment.extend({
      first : DS.attr("string"),
      last  : DS.attr("string")
    });

    House = DS.ModelFragment.extend({
      name   : DS.attr("string"),
      region : DS.attr("string"),
      exiled : DS.attr("boolean")
    });

    env = setupEnv({
      person: Person,
      name: Name,
      house: House
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

test("getting `isDirty` and calling `rollback` on a fragment is deprecated", function() {
  store.push({
    type: 'person',
    id: 1,
    attributes: {
      name: {
        first : "Ellaria",
        last  : "Sand"
      }
    }
  });

  return store.find('person', 1).then(function(person) {
      var name = person.get('name');

    expectDeprecation(function() {
      name.get('isDirty');
    }, /DS\.Model#isDirty has been deprecated/);

    expectDeprecation(function() {
      name.set('last', 'Martell');
      name.rollback();
    }, /Using model\.rollback\(\) has been deprecated/);
  });
});

test("getting `isDirty` and calling `rollback` on a fragment array is deprecated", function() {
  Person.reopen({
    houses: DS.hasManyFragments('house'),
  });

  store.push({
    type: 'person',
    id: 1,
    attributes: {
      name: {
        first : "Elia",
        last  : "Martell"
      },
      houses: [
        {
          name   : "Martell",
          region : "Dorne",
          exiled : false
        },
        {
          name   : "Targaryen",
          region : "Crownlands",
          exiled : true
        }
      ]
    }
  });

  return store.find('person', 1).then(function(person) {
    var houses = person.get('houses');

    expectDeprecation(function() {
      houses.get('isDirty');
    }, /The `isDirty` method of fragment arrays has been deprecated/);

    expectDeprecation(function() {
      houses.popObject();
      houses.rollback();
    }, /Using array\.rollback\(\) has been deprecated/);
  });
});

test("getting `isDirty` and calling `rollback` on an untyped fragment array is deprecated", function() {
  Person.reopen({
    titles: DS.hasManyFragments(),
  });

  store.push({
    type: 'person',
    id: 1,
    attributes: {
      name: {
        first : "Barristan",
        last  : "Selmy"
      },
      titles: [
        'Ser',
        'Lord Commander of the Kingsguard',
        'Hand of the Queen'
      ]
    }
  });

  return store.find('person', 1).then(function(person) {
    var titles = person.get('titles');

    expectDeprecation(function() {
      titles.get('isDirty');
    }, /The `isDirty` method of fragment arrays has been deprecated/);

    expectDeprecation(function() {
      titles.removeAt(1);
      titles.rollback();
    }, /Using array\.rollback\(\) has been deprecated/);
  });
});