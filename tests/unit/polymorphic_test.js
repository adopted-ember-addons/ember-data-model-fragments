import { module, test } from 'qunit';
import { setupApplicationTest } from '../helpers';
import Animal from 'dummy/models/animal';
import Lion from 'dummy/models/lion';
import Elephant from 'dummy/models/elephant';
import ComponentOptionsText from 'dummy/models/component-options-text';
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

    const zoo2 = await store.findRecord('zoo', 1);
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

    const zoo2 = await store.findRecord('zoo', 1);
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

  test("fragment array's createFragment supports polymorphism with string typeKey", async function (assert) {
    store.push({
      data: {
        type: 'zoo',
        id: 1,
        attributes: zoo,
      },
    });

    const record = await store.find('zoo', 1);
    const animals = record.animals;

    const newLion = animals.createFragment({
      $type: 'lion',
      name: 'Alex',
      hasManes: 'true',
    });

    assert.ok(newLion instanceof Animal, 'new lion is an animal');
    assert.equal(newLion.name, 'Alex', "new animal's name is correct");
    assert.ok(newLion instanceof Lion, 'new lion is a lion');
    assert.ok(newLion.hasManes, 'lion has manes');
    assert.strictEqual(newLion.zoo, record, 'set the fragment owner');

    const newElephant = animals.createFragment({
      $type: 'elephant',
      name: 'Heffalump',
      trunkLength: 7,
    });

    assert.ok(newElephant instanceof Animal, 'new elephant is an animal');
    assert.equal(newElephant.name, 'Heffalump', "new animal's name is correct");
    assert.ok(newElephant instanceof Elephant, 'new elephant is an elephant');
    assert.equal(
      newElephant.trunkLength,
      7,
      "elephant's trunk length is correct"
    );
    assert.strictEqual(newElephant.zoo, record, 'set the fragment owner');
  });

  test("fragment array's createFragment supports polymorphism with function typeKey", async function (assert) {
    store.push({
      data: {
        type: 'component',
        id: 1,
        attributes: {
          type: 'text',
          optionsHistory: [],
        },
      },
    });

    const component = await store.find('component', 1);
    const textOptions = component.optionsHistory.createFragment({
      fontFamily: 'Verdana',
      fontSize: 12,
    });

    assert.ok(
      textOptions instanceof ComponentOptionsText,
      'options is ComponentOptionsText'
    );
    assert.equal(
      textOptions.fontFamily,
      'Verdana',
      'options has correct fontFamily attribute'
    );
    assert.equal(
      textOptions.fontSize,
      12,
      'options has correct fontSize attribute'
    );
    assert.equal(
      component.optionsHistory.length,
      1,
      'fragment object was added to fragment array'
    );
  });
});
