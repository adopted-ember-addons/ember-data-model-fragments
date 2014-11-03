var store, Zoo, Animal, Elephant, Lion;

module("unit/fragments - polymorphism", {
  setup: function() {
    Zoo = DS.Model.extend({
      name: DS.attr("string"),
      city: DS.attr("string"),
      star: DS.hasOneFragment("animal", { polymorphic: true, typeKey: '$type' }),
      animals: DS.hasManyFragments("animal", { polymorphic: true, typeKey: '$type' }),
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

    store = createStore({
      zoo: Zoo,
      animal: Animal,
      elephant: Elephant,
      lion: Lion,
    });

    store.push(Zoo, {
      id: 1,
      name: 'Chilly Zoo',
      city: 'Winterfell',
      star: {
        $type: 'lion',
        name: 'Mittens',
        hasManes: 'true',
      },
      animals: [{
        $type: 'lion',
        name: 'Mittens',
        hasManes: 'true',
      }, {
        $type: 'elephant',
        name: 'Snuitje',
        trunkLength: 4,
      }]
    });
  },

  teardown: function() {
    store = null;
    Zoo = null;
    Animal = null;
    Elephant = null;
    Lion = null;
  }
});

test("hasOneFragment supports polymorphism", function() {
  store.find(Zoo, 1).then(async(function(zoo) {
    equal(zoo.get("name"), "Chilly Zoo", "zoo name is correct");
    equal(zoo.get("city"), "Winterfell", "zoo city is correct");

    var star = zoo.get("star");
    ok(star instanceof Animal, "zoo's star is an animal");
    equal(star.get("name"), "Mittens", "animal name is correct");
    ok(star instanceof Lion, "zoo's star is a lion");
    ok(star.get("hasManes"), "lion has manes");
  }));
});

test("hasManyFragments supports polymorphism", function() {
  store.find(Zoo, 1).then(async(function(zoo) {
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
  }));
});

