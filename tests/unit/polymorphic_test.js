import { module, test } from 'qunit';
import { setupApplicationTest } from '../helpers';
import Animal from 'dummy/models/animal';
import Lion from 'dummy/models/lion';
import Elephant from 'dummy/models/elephant';
let store, zoo;

module('unit - Polymorphism', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function () {
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

  test('fragment properties support polymorphism', async function (assert) {
    store.push({
      data: {
        type: 'zoo',
        id: 1,
        attributes: zoo,
      },
    });

    const zoo2 = await store.find('zoo', 1);
    assert.equal(zoo2.name, 'Chilly Zoo', 'zoo name is correct');
    assert.equal(zoo2.city, 'Winterfell', 'zoo city is correct');

    const star = zoo2.star;
    assert.ok(star instanceof Animal, "zoo's star is an animal");
    assert.equal(star.name, 'Mittens', 'animal name is correct');
    assert.ok(star instanceof Lion, "zoo's star is a lion");
    assert.ok(star.hasManes, 'lion has manes');
  });

  test('fragment array properties support polymorphism', async function (assert) {
    store.push({
      data: {
        type: 'zoo',
        id: 1,
        attributes: zoo,
      },
    });

    const zoo2 = await store.find('zoo', 1);
    const animals = zoo2.animals;
    assert.equal(animals.length, 2);

    const first = animals.objectAt(0);
    assert.ok(first instanceof Animal);
    assert.equal(first.name, 'Mittens', "first animal's name is correct");
    assert.ok(first instanceof Lion);
    assert.ok(first.hasManes, 'lion has manes');

    const second = animals.objectAt(1);
    assert.ok(second instanceof Animal);
    assert.equal(second.name, 'Snuitje', "second animal's name is correct");
    assert.ok(second instanceof Elephant);
    assert.equal(second.trunkLength, 4, "elephant's trunk length is correct");
  });
});
