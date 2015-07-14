var env, store, zoo, Zoo, Animal, Elephant, Lion;

module("unit/fragments - Polymorphism", {
  setup: function() {
    Zoo = DS.Model.extend({
      name: DS.attr("string"),
      city: DS.attr("string"),
      star: DS.hasOneFragment("animal", { polymorphic: true, typeKey: '$type' }),
      animals: DS.hasManyFragments("animal", { polymorphic: true, typeKey: '$type', defaultValue: [] }),
    });

    Animal = DS.ModelFragment.extend({
      name: DS.attr("string"),
    });

    Elephant = Animal.extend({
      trunkLength: DS.attr("number"),
    });

    Lion = Animal.extend({
      hasManes: DS.attr("boolean"),
    });

    env = setupEnv({
      zoo: Zoo,
      animal: Animal,
      elephant: Elephant,
      lion: Lion,
    });

    store = env.store;

    zoo = {
      name: 'Chilly Zoo',
      city: 'Winterfell',
      star: {
        $type: 'lion',
        name: 'Mittens',
        hasManes: 'true',
      },
      animals: [
        {
          $type: 'lion',
          name: 'Mittens',
          hasManes: 'true',
        },
        {
          $type: 'elephant',
          name: 'Snuitje',
          trunkLength: 4,
        }
      ]
    };
  },

  teardown: function() {
    env = null;
    store = null;
    Zoo = null;
    Animal = null;
    Elephant = null;
    Lion = null;
  }
});

test("hasOneFragment supports polymorphism", function() {
  store.push({
    type: 'zoo',
    id: 1,
    attributes: zoo
  });

  return store.find('zoo', 1).then(function(zoo) {
    equal(zoo.get("name"), "Chilly Zoo", "zoo name is correct");
    equal(zoo.get("city"), "Winterfell", "zoo city is correct");

    var star = zoo.get("star");
    ok(star instanceof Animal, "zoo's star is an animal");
    equal(star.get("name"), "Mittens", "animal name is correct");
    ok(star instanceof Lion, "zoo's star is a lion");
    ok(star.get("hasManes"), "lion has manes");
  });
});

test("hasManyFragments supports polymorphism", function() {
  store.push({
    type: 'zoo',
    id: 1,
    attributes: zoo
  });

  return store.find('zoo', 1).then(function(zoo) {
    var animals = zoo.get("animals");
    equal(animals.get("length"), 2);

    var first = animals.objectAt(0);
    ok(first instanceof Animal);
    equal(first.get("name"), "Mittens", "first animal's name is correct");
    ok(first instanceof Lion);
    ok(first.get("hasManes"), "lion has manes");

    var second = animals.objectAt(1);
    ok(second instanceof Animal);
    equal(second.get("name"), "Snuitje", "second animal's name is correct");
    ok(second instanceof Elephant);
    equal(second.get("trunkLength"), 4, "elephant's trunk length is correct");
  });
});

test("`DS.hasOneFragment` type-checks check the superclass when MODEL_FACTORY_INJECTIONS is enabled", function() {
  expect(1);

  store.push({
    type: 'zoo',
    id: 1,
    attributes: zoo
  });

  var injectionValue = Ember.MODEL_FACTORY_INJECTIONS;
  Ember.MODEL_FACTORY_INJECTIONS = true;

  try {
    Ember.run(function () {
      var zoo = store.createRecord('zoo', { name: 'The World' });
      var animal = store.createFragment('elephant', { name: 'Mr. Pink' });

      zoo.set('star', animal);

      equal(zoo.get('star.name'), animal.get('name'), 'The type check succeeded');
    });
  } finally {
    Ember.MODEL_FACTORY_INJECTIONS = injectionValue;
  }
});

test("rolling back a `DS.hasOneFragment` fragment property that was set to null checks the superclass when MODEL_FACTORY_INJECTIONS is enabled", function() {
  expect(1);

  store.push({
    type: 'zoo',
    id: 1,
    attributes: zoo
  });

  var injectionValue = Ember.MODEL_FACTORY_INJECTIONS;
  Ember.MODEL_FACTORY_INJECTIONS = true;

  return store.find('zoo', 1).then(function(zoo) {
    var animal = zoo.get('star');

    zoo.set('star', null);
    zoo.rollback();

    equal(zoo.get('star.name'), animal.get('name'), 'The type check succeeded');
  }).finally(function() {
    Ember.MODEL_FACTORY_INJECTIONS = injectionValue;
  });
});

test("`DS.hasManyFragments` type-checks check the superclass when MODEL_FACTORY_INJECTIONS is enabled", function() {
  expect(1);

  var injectionValue = Ember.MODEL_FACTORY_INJECTIONS;
  Ember.MODEL_FACTORY_INJECTIONS = true;

  try {
    Ember.run(function () {
      var zoo = store.createRecord('zoo', { name: 'The World' });
      var animal = store.createFragment('elephant', { name: 'Whitey' });

      zoo.get('animals').pushObject(animal);

      equal(zoo.get('animals.firstObject.name'), animal.get('name'), 'The type check succeeded');
    });
  } finally {
    Ember.MODEL_FACTORY_INJECTIONS = injectionValue;
  }
});
