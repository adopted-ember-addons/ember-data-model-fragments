var env, store, Person;

QUnit.module("unit - `MF.array` property", {
  setup: function() {
    Person = DS.Model.extend({
      name: DS.attr('string'),
      titles: MF.array('string')
    });

    env = setupEnv({
      person: Person
    });

    store = env.store;

    ok(true); // expectNoDeprecation();
  }
});

test("array properties are converted to an array-ish containing original values", function() {
  var values = [ "Hand of the King", "Master of Coin" ];

  store.push({
    data: {
      type: 'person',
      id: 1,
      attributes: {
        name: "Tyrion Lannister",
        titles: values
      }
    }
  });

  return store.find('person', 1).then(function(person) {
    var titles = person.get('titles');

    ok(Ember.isArray(titles), "property is array-like");

    ok(titles.every(function(title, index) {
      return title === values[index];
    }), "each title matches the original value");
  });
});

test("null values are allowed", function() {
  store.push({
    data: {
      type: 'person',
      id: 1,
      attributes: {
        name: 'Many-Faced God',
        titles: null
      }
    }
  });

  return store.find('person', 1).then(function(person) {
    equal(person.get('titles'), null, "property is null");
  });
});

test("setting to null is allowed", function() {
  store.push({
    data: {
      type: 'person',
      id: 1,
      attributes: {
        name: "R'hllor",
        titles: [ 'Lord of Light', 'The Heart of Fire', 'The God of Flame and Shadow' ]
      }
    }
  });

  return store.find('person', 1).then(function(person) {
    person.set('titles', null);

    equal(person.get('titles'), null, "property is null");
  });
});

test("array properties default to an empty array-ish", function() {
  Ember.run(function() {
    var person = store.createRecord('person', {
      name: 'Boros Blount'
    });

    deepEqual(person.get('titles').toArray(), [], "default value is correct");
  });
});

test("array properties can have default values", function() {
  Ember.run(function() {
    Person.reopen({
      titles: MF.array({ defaultValue: [ 'Ser' ] })
    });

    var person = store.createRecord('person', {
      name: 'Barristan Selmy'
    });

    ok(person.get('titles.length'), 1, "default value length is correct");
    equal(person.get('titles.firstObject'), 'Ser', "default value is correct");
  });
});

test("default values can be functions", function() {
  Ember.run(function() {
    Person.reopen({
      titles: MF.array({ defaultValue: function() { return [ 'Viper' ]; } })
    });

    var person = store.createRecord('person', {
      name: 'Oberyn Martell'
    });

    ok(person.get('titles.length'), 1, "default value length is correct");
    equal(person.get('titles.firstObject'), 'Viper', "default value is correct");
  });
});
