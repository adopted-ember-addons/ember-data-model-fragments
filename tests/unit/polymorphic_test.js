import { run } from '@ember/runloop';
import { test } from 'qunit';
import moduleForAcceptance from '../helpers/module-for-acceptance';
import getOwner from '../helpers/get-owner';
import Animal from 'dummy/models/animal';
import Lion from 'dummy/models/lion';
import Elephant from 'dummy/models/elephant';
let store, zoo;

moduleForAcceptance('unit - Polymorphism', {
  beforeEach(assert) {
    store = getOwner(this).lookup('service:store');

    assert.expectNoDeprecation();

    zoo = {
      name: 'Chilly Zoo',
      city: 'Winterfell',
      star: {
        $type: 'lion',
        name: 'Mittens',
        hasManes: 'true'
      },
      animals: [
        {
          $type: 'lion',
          name: 'Mittens',
          hasManes: 'true'
        },
        {
          $type: 'elephant',
          name: 'Snuitje',
          trunkLength: 4
        }
      ]
    };
  },

  afterEach() {
    store = null;
  }
});

test('fragment properties support polymorphism', function(assert) {
  run(() => {
    store.push({
      data: {
        type: 'zoo',
        id: 1,
        attributes: zoo
      }
    });

    return store.find('zoo', 1).then(zoo => {
      assert.equal(zoo.get('name'), 'Chilly Zoo', 'zoo name is correct');
      assert.equal(zoo.get('city'), 'Winterfell', 'zoo city is correct');

      let star = zoo.get('star');
      assert.ok(star instanceof Animal, 'zoo\'s star is an animal');
      assert.equal(star.get('name'), 'Mittens', 'animal name is correct');
      assert.ok(star instanceof Lion, 'zoo\'s star is a lion');
      assert.ok(star.get('hasManes'), 'lion has manes');
    });
  });
});

test('fragment array properties support polymorphism', function(assert) {
  run(() => {
    store.push({
      data: {
        type: 'zoo',
        id: 1,
        attributes: zoo
      }
    });

    return store.find('zoo', 1).then(zoo => {
      let animals = zoo.get('animals');
      assert.equal(animals.get('length'), 2);

      let first = animals.objectAt(0);
      assert.ok(first instanceof Animal);
      assert.equal(first.get('name'), 'Mittens', 'first animal\'s name is correct');
      assert.ok(first instanceof Lion);
      assert.ok(first.get('hasManes'), 'lion has manes');

      let second = animals.objectAt(1);
      assert.ok(second instanceof Animal);
      assert.equal(second.get('name'), 'Snuitje', 'second animal\'s name is correct');
      assert.ok(second instanceof Elephant);
      assert.equal(second.get('trunkLength'), 4, 'elephant\'s trunk length is correct');
    });
  });
});

