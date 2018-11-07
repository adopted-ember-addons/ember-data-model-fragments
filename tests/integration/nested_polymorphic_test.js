import { module, test } from 'qunit';
import { setupApplicationTest } from 'ember-qunit';
import Animal from 'dummy/models/animal';
import Lion from 'dummy/models/lion';
import PreyGiraffe from 'dummy/models/prey-giraffe';
import PreyHog from 'dummy/models/prey-hog';
import Pretender from 'pretender';

let store, owner, server;

module('integration - Nested Polymorphic fragments with custom type normalizer', function(hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function(assert) {
    owner = this.owner;
    store = owner.lookup('service:store');
    server = new Pretender();

    assert.expectNoDeprecation();
  });

  hooks.afterEach(function() {
    store = null;
    owner = null;
    server.shutdown();
  });

  test('when outter array is normalized and inner array is normalized', function(assert) {
    let data = {
      id: 1,
      name: 'Nested Zoo',
      animals: [
        {
          _normalizeBackendTypeTo$Type: true,
          backendType: 'lion',
          name: 'Mittens',
          hasManes: 'true',
          preys: [
            {
              _normalizeBackendTypeTo$Type: true,
              backendType: 'giraffe',
              neckLength: 20
            },
            {
              _normalizeBackendTypeTo$Type: true,
              backendType: 'hog',
              stripesColour: 'golden'
            }
          ]
        }
      ]
    };

    server.get('/zoos/1', () => {
      return [200, { 'Content-Type': 'application/json' }, JSON.stringify({ zoo: data })];
    });

    return store.find('zoo', 1).then(zoo => {
      let animals = zoo.get('animals');
      assert.equal(animals.get('length'), 1);

      let first = animals.objectAt(0);
      assert.ok(first instanceof Animal, 'first animal is Animal');
      assert.equal(first.get('name'), 'Mittens', 'lion has correct name');
      assert.ok(first instanceof Lion, 'first animal is Lion');
      let lionPreys = first.get('preys');
      assert.equal(lionPreys.get('length'), 2, 'lion has 2 preys');

      let firstPrey = lionPreys.objectAt(0);
      assert.ok(firstPrey instanceof PreyGiraffe, 'first prey is Giraffe');
      assert.equal(firstPrey.get('neckLength'), '20', 'giraffe\'s neck length is correct');

      let secondPrey = lionPreys.objectAt(1);
      assert.ok(secondPrey instanceof PreyHog, 'second prey is Hog');
      assert.equal(secondPrey.get('stripesColour'), 'golden', 'hog\'s stripes colour is correct');
    });
  });

  test('when outter array has $type and inner array is normalized', function(assert) {
    let data = {
      id: 1,
      name: 'Nested Zoo',
      animals: [
        {
          $type: 'lion',
          name: 'Mittens',
          hasManes: 'true',
          preys: [
            {
              _normalizeBackendTypeTo$Type: true,
              backendType: 'giraffe',
              neckLength: 20
            },
            {
              _normalizeBackendTypeTo$Type: true,
              backendType: 'hog',
              stripesColour: 'golden'
            }
          ]
        }
      ]
    };

    server.get('/zoos/1', () => {
      return [200, { 'Content-Type': 'application/json' }, JSON.stringify({ zoo: data })];
    });

    return store.find('zoo', 1).then(zoo => {
      let animals = zoo.get('animals');
      assert.equal(animals.get('length'), 1);

      let first = animals.objectAt(0);
      assert.ok(first instanceof Animal, 'first animal is Animal');
      assert.equal(first.get('name'), 'Mittens', 'lion has correct name');
      assert.ok(first instanceof Lion, 'first animal is Lion');
      let lionPreys = first.get('preys');
      assert.equal(lionPreys.get('length'), 2, 'lion has 2 preys');

      let firstPrey = lionPreys.objectAt(0);
      assert.ok(firstPrey instanceof PreyGiraffe, 'first prey is Giraffe');
      assert.equal(firstPrey.get('neckLength'), '20', 'giraffe\'s neck length is correct');

      let secondPrey = lionPreys.objectAt(1);
      assert.ok(secondPrey instanceof PreyHog, 'second prey is Hog');
      assert.equal(secondPrey.get('stripesColour'), 'golden', 'hog\'s stripes colour is correct');
    });
  });

  test('when outter array is normalized and inner array has $type', function(assert) {
    let data = {
      id: 1,
      name: 'Nested Zoo',
      animals: [
        {
          _normalizeBackendTypeTo$Type: true,
          backendType: 'lion',
          name: 'Mittens',
          hasManes: 'true',
          preys: [
            {
              $type: 'prey-giraffe',
              neckLength: 20
            },
            {
              $type: 'prey-hog',
              stripesColour: 'golden'
            }
          ]
        }
      ]
    };

    server.get('/zoos/1', () => {
      return [200, { 'Content-Type': 'application/json' }, JSON.stringify({ zoo: data })];
    });

    return store.find('zoo', 1).then(zoo => {
      let animals = zoo.get('animals');
      assert.equal(animals.get('length'), 1);

      let first = animals.objectAt(0);
      assert.ok(first instanceof Animal, 'first animal is Animal');
      assert.equal(first.get('name'), 'Mittens', 'lion has correct name');
      assert.ok(first instanceof Lion, 'first animal is Lion');
      let lionPreys = first.get('preys');
      assert.equal(lionPreys.get('length'), 2, 'lion has 2 preys');

      let firstPrey = lionPreys.objectAt(0);
      assert.ok(firstPrey instanceof PreyGiraffe, 'first prey is Giraffe');
      assert.equal(firstPrey.get('neckLength'), '20', 'giraffe\'s neck length is correct');

      let secondPrey = lionPreys.objectAt(1);
      assert.ok(secondPrey instanceof PreyHog, 'second prey is Hog');
      assert.equal(secondPrey.get('stripesColour'), 'golden', 'hog\'s stripes colour is correct');
    });
  });
});
