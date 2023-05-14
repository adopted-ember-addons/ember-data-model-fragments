import { module, test } from 'qunit';
import { setupApplicationTest } from 'ember-qunit';
import Animal from 'dummy/models/animal';
import Lion from 'dummy/models/lion';
import Elephant from 'dummy/models/elephant';
let store, zoo;

module('unit - Polymorphism', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function (assert) {
    store = this.owner.lookup('service:store');

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
        },
      ],
    };
  });

  hooks.afterEach(function () {
    store = null;
  });

  test('fragment properties support polymorphism', function (assert) {
    store.push({
      data: {
        type: 'zoo',
        id: 1,
        attributes: zoo,
      },
    });

    return store.find('zoo', 1).then((zoo) => {
      assert.equal(zoo.get('name'), 'Chilly Zoo', 'zoo name is correct');
      assert.equal(zoo.get('city'), 'Winterfell', 'zoo city is correct');

      let star = zoo.get('star');
      assert.ok(star instanceof Animal, "zoo's star is an animal");
      assert.equal(star.get('name'), 'Mittens', 'animal name is correct');
      assert.ok(star instanceof Lion, "zoo's star is a lion");
      assert.ok(star.get('hasManes'), 'lion has manes');
    });
  });

  test('fragment array properties support polymorphism', function (assert) {
    store.push({
      data: {
        type: 'zoo',
        id: 1,
        attributes: zoo,
      },
    });

    return store.find('zoo', 1).then((zoo) => {
      let animals = zoo.get('animals');
      assert.equal(animals.get('length'), 2);

      let first = animals.objectAt(0);
      assert.ok(first instanceof Animal);
      assert.equal(
        first.get('name'),
        'Mittens',
        "first animal's name is correct"
      );
      assert.ok(first instanceof Lion);
      assert.ok(first.get('hasManes'), 'lion has manes');

      let second = animals.objectAt(1);
      assert.ok(second instanceof Animal);
      assert.equal(
        second.get('name'),
        'Snuitje',
        "second animal's name is correct"
      );
      assert.ok(second instanceof Elephant);
      assert.equal(
        second.get('trunkLength'),
        4,
        "elephant's trunk length is correct"
      );
    });
  });
});
