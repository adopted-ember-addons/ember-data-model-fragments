var env, store, Person, Name, House;

QUnit.module("unit - Deprecations", {
  setup: function() {
    Person = DS.Model.extend({
      name: MF.fragment('name')
    });

    Name = MF.Fragment.extend({
      first: DS.attr('string'),
      last: DS.attr('string')
    });

    House = MF.Fragment.extend({
      name: DS.attr('string'),
      region: DS.attr('string'),
      exiled: DS.attr('boolean')
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

test("defining a `DS.hasOneFragment` property is deprecated", function() {
  expectDeprecation(function() {
    DS.Model.extend({
      name: DS.hasOneFragment('name')
    });
  }, "The `DS.hasOneFragment` property has been deprecated in favor of `MF.fragment`");
});

test("defining a `DS.hasManyFragments` property is deprecated", function() {
  expectDeprecation(function() {
    DS.Model.extend({
      names: DS.hasManyFragments('name')
    });
  }, "The `DS.hasManyFragments` property has been deprecated in favor of `MF.fragmentArray`");
});

test("defining a `DS.hasManyFragments` property without a model is deprecated", function() {
  expectDeprecation(function() {
    DS.Model.extend({
      names: DS.hasManyFragments()
    });
  }, "The `DS.hasManyFragments` property without a model name has been deprecated in favor of `MF.array`");
});

test("defining a `DS.fragmentOwner` property is deprecated", function() {
  expectDeprecation(function() {
    MF.Fragment.extend({
      names: DS.fragmentOwner()
    });
  }, "The `DS.fragmentOwner` property has been deprecated in favor of `MF.fragmentOwner`");
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
    houses: MF.fragmentArray('house'),
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
    titles: MF.array(),
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

test("creating a record with a fragment array property with no `defaultValue` logs a warning", function() {
  Person.reopen({
    titles: MF.fragmentArray(),
  });

  expectWarning(function() {
    var person = store.createRecord('person');

    person.get('titles');
  }, /The default value of fragment array properties will change from `null` to an empty array in v1\.0/);
});

test("creating a record with a fragment array property with a `defaultValue` does not log a warning", function() {
  Person.reopen({
    titles: MF.fragmentArray({ defaultValue: [] }),
  });

  expectNoWarning(function() {
    var person = store.createRecord('person');

    person.getProperties('titles', 'name');
  });
});
