import Ember from 'ember';
import { test } from 'qunit';
import moduleForAcceptance from '../helpers/module-for-acceptance';
import getOwner from '../helpers/get-owner';
import Animal from 'dummy/models/animal';
import Lion from 'dummy/models/lion';
import Elephant from 'dummy/models/elephant';
var store, zoo;

moduleForAcceptance("unit - Polymorphism", {
  beforeEach: function(assert) {
    store = getOwner(this).lookup('service:store');

    assert.expectNoDeprecation();

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

  afterEach: function() {
    store = null;
  }
});

test("fragment properties support polymorphism", function(assert) {
  Ember.run(() => {
    store.push({
      data: {
        type: 'zoo',
        id: 1,
        attributes: zoo
      }
    });

    return store.find('zoo', 1).then(function(zoo) {
      assert.equal(zoo.get("name"), "Chilly Zoo", "zoo name is correct");
      assert.equal(zoo.get("city"), "Winterfell", "zoo city is correct");

      var star = zoo.get("star");
      assert.ok(star instanceof Animal, "zoo's star is an animal");
      assert.equal(star.get("name"), "Mittens", "animal name is correct");
      assert.ok(star instanceof Lion, "zoo's star is a lion");
      assert.ok(star.get("hasManes"), "lion has manes");
    });
  });
});

test("fragment array properties support polymorphism", function(assert) {
  Ember.run(() => {
    store.push({
      data: {
        type: 'zoo',
        id: 1,
        attributes: zoo
      }
    });

    return store.find('zoo', 1).then(function(zoo) {
      var animals = zoo.get("animals");
      assert.equal(animals.get("length"), 2);

      var first = animals.objectAt(0);
      assert.ok(first instanceof Animal);
      assert.equal(first.get("name"), "Mittens", "first animal's name is correct");
      assert.ok(first instanceof Lion);
      assert.ok(first.get("hasManes"), "lion has manes");

      var second = animals.objectAt(1);
      assert.ok(second instanceof Animal);
      assert.equal(second.get("name"), "Snuitje", "second animal's name is correct");
      assert.ok(second instanceof Elephant);
      assert.equal(second.get("trunkLength"), 4, "elephant's trunk length is correct");
    });
  });
});

test("fragment property type-checks check the superclass when MODEL_FACTORY_INJECTIONS is enabled", function(assert) {
  var injectionValue = Ember.MODEL_FACTORY_INJECTIONS;
  Ember.MODEL_FACTORY_INJECTIONS = true;

  try {
    Ember.run(() => {
      store.push({
        data: {
          type: 'zoo',
          id: 1,
          attributes: zoo
        }
      });

      zoo = store.createRecord('zoo', { name: 'The World' });
      var animal = store.createFragment('elephant', { name: 'Mr. Pink' });

      zoo.set('star', animal);

      assert.equal(zoo.get('star.name'), animal.get('name'), 'The type check succeeded');
    });
  } finally {
    Ember.MODEL_FACTORY_INJECTIONS = injectionValue;
  }
});

test("rolling back a fragment property that was set to null checks the superclass when MODEL_FACTORY_INJECTIONS is enabled", function(assert) {
  Ember.run(() => {
    store.push({
      data: {
        type: 'zoo',
        id: 1,
        attributes: zoo
      }
    });

    var injectionValue = Ember.MODEL_FACTORY_INJECTIONS;
    Ember.MODEL_FACTORY_INJECTIONS = true;

    return store.find('zoo', 1).then(function(zoo) {
      var animal = zoo.get('star');

      zoo.set('star', null);
      zoo.rollbackAttributes();

      assert.equal(zoo.get('star.name'), animal.get('name'), 'The type check succeeded');
    }).finally(function() {
      Ember.MODEL_FACTORY_INJECTIONS = injectionValue;
    });
  });
});

test("fragment array property type-checks check the superclass when MODEL_FACTORY_INJECTIONS is enabled", function(assert) {
  var injectionValue = Ember.MODEL_FACTORY_INJECTIONS;
  Ember.MODEL_FACTORY_INJECTIONS = true;

  try {
    Ember.run(() => {
      var zoo = store.createRecord('zoo', { name: 'The World' });
      var animal = store.createFragment('elephant', { name: 'Whitey' });

      zoo.get('animals').pushObject(animal);

      assert.equal(zoo.get('animals.firstObject.name'), animal.get('name'), 'The type check succeeded');
    });
  } finally {
    Ember.MODEL_FACTORY_INJECTIONS = injectionValue;
  }
});
