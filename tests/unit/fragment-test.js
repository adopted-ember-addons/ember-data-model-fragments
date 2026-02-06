import { all } from 'rsvp';
import Ember from 'ember';
import { module, test } from 'qunit';
import { setupApplicationTest } from '../helpers';
import Pretender from 'pretender';
import Lion from 'dummy/models/lion';
import Elephant from 'dummy/models/elephant';

let store;

module('unit - `MF.Fragment`', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function () {
    store = this.owner.lookup('service:store');
  });

  hooks.afterEach(function () {
    store = null;
  });

  test('copied fragments can be added to any record', async function (assert) {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          name: {
            first: 'Jon',
            last: 'Snow',
          },
        },
      },
    });

    store.push({
      data: {
        type: 'person',
        id: 2,
        attributes: {},
      },
    });

    const people = await all([
      store.findRecord('person', 1),
      store.findRecord('person', 2),
    ]);
    const copy = people[0].name.copy();

    people[1].set('name', copy);

    assert.ok(true, 'fragment copies can be assigned to other records');
  });

  test("copying a fragment copies the fragment's properties", async function (assert) {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          name: {
            first: 'Jon',
            last: 'Snow',
          },
        },
      },
    });

    const person = await store.findRecord('person', 1);
    const copy = person.name.copy();

    assert.ok(copy.first, 'Jon');
    assert.ok(copy.last, 'Snow');
  });

  test('fragments are `Ember.Comparable`', function (assert) {
    const fragment = store.createFragment('name');

    assert.ok(Ember.Comparable.detect(fragment), 'fragments are comparable');
  });

  test('fragments support toString', function (assert) {
    store.push({
      data: {
        type: 'vehicle',
        id: 1,
        attributes: {
          passenger: {
            name: {
              first: 'Loras',
              last: 'Tyrell',
            },
          },
        },
      },
    });

    const vehicle = store.peekRecord('vehicle', 1);

    assert.ok(vehicle.passenger.toString().includes('owner(1)'));
    assert.ok(vehicle.passenger.name.toString().includes('owner(null)'));
    assert.notOk(
      store.createFragment('name').toString().includes('owner('),
      'fragment with no owner',
    );
  });

  test('fragments are compared by reference', function (assert) {
    const fragment1 = store.createFragment('name', {
      first: 'Jon',
      last: 'Arryn',
    });
    const fragment2 = store.createFragment('name', {
      first: 'Jon',
      last: 'Arryn',
    });

    assert.ok(
      fragment1.compare(fragment1, fragment2) !== 0,
      'deeply equal objects are not the same',
    );
    assert.ok(
      fragment1.compare(fragment1, fragment1) === 0,
      'identical objects are the same',
    );
  });

  test('newly create fragments start in the new state', function (assert) {
    const fragment = store.createFragment('name');

    assert.ok(fragment.isNew, 'fragments start as new');
  });

  test("changes to fragments are indicated in the owner record's `changedAttributes`", async function (assert) {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          name: {
            first: 'Loras',
            last: 'Tyrell',
          },
        },
      },
    });

    const person = await store.findRecord('person', 1);
    const name = person.name;

    name.set('last', 'Baratheon');

    const [oldName, newName] = person.changedAttributes().name;
    assert.deepEqual(
      oldName,
      { first: 'Loras', last: 'Tyrell', prefixes: [] },
      'old fragment is indicated in the diff object',
    );
    assert.deepEqual(
      newName,
      { first: 'Loras', last: 'Baratheon', prefixes: [] },
      'new fragment is indicated in the diff object',
    );
  });

  test("fragment properties that are set to null are indicated in the owner record's `changedAttributes`", async function (assert) {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          name: {
            first: 'Rob',
            last: 'Stark',
          },
        },
      },
    });

    const person = await store.findRecord('person', 1);
    person.set('name', null);

    const [oldName, newName] = person.changedAttributes().name;
    assert.deepEqual(
      oldName,
      { first: 'Rob', last: 'Stark', prefixes: [] },
      'old fragment is indicated in the diff object',
    );
    assert.deepEqual(
      newName,
      null,
      'new fragment is indicated in the diff object',
    );
  });

  test("fragment properties that are initially null are indicated in the owner record's `changedAttributes`", async function (assert) {
    const server = new Pretender();
    server.put('/people/:id', () => {
      return [204, { 'Content-Type': 'application/json' }, '{}'];
    });

    try {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            name: null,
          },
        },
      });

      const person = await store.findRecord('person', 1);
      person.set('name', {
        first: 'Rob',
        last: 'Stark',
      });

      const [oldName, newName] = person.changedAttributes().name;
      assert.deepEqual(
        oldName,
        null,
        'old fragment is indicated in the diff object',
      );
      assert.deepEqual(
        newName,
        { first: 'Rob', last: 'Stark', prefixes: [] },
        'new fragment is indicated in the diff object',
      );

      // Save the record which will trigger willCommit and didCommit
      await person.save();

      assert.strictEqual(
        person.changedAttributes().name,
        undefined,
        'changedAttributes is reset after commit',
      );
    } finally {
      server.shutdown();
    }
  });

  test('changes to attributes can be rolled back', async function (assert) {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          name: {
            first: 'Ramsay',
            last: 'Snow',
          },
        },
      },
    });

    const person = await store.findRecord('person', 1);
    const name = person.name;

    name.set('last', 'Bolton');
    name.rollbackAttributes();

    assert.strictEqual(name.last, 'Snow', 'fragment properties are restored');
    assert.ok(!name.hasDirtyAttributes, 'fragment is in clean state');
  });

  test('fragments without an owner can be destroyed', function (assert) {
    const fragment = store.createFragment('name');
    fragment.destroy();
    assert.ok(fragment.isDestroying, 'the fragment is being destroyed');
  });

  test('fragments unloaded/reload w/ relationship', async function (assert) {
    // Related to: https://github.com/lytics/ember-data-model-fragments/issues/261

    function isUnloaded(recordOrFragment) {
      // Ember-2.13 and newer uses `recordOrFragment.isDestroyed`
      return recordOrFragment.isDestroyed;
    }

    function pushPerson() {
      store.push({
        data: {
          type: 'person',
          id: 1,
          attributes: {
            title: 'Zoo Manager',
          },
        },
      });
      return store.peekRecord('person', 1);
    }

    function pushZoo() {
      store.push({
        data: {
          type: 'zoo',
          id: 1,
          attributes: {
            name: 'Cincinnati Zoo',
            star: {
              $type: 'elephant',
              name: 'Sabu',
            },
          },
          relationships: {
            manager: {
              data: { type: 'person', id: 1 },
            },
          },
        },
      });
      return store.peekRecord('zoo', 1);
    }

    const person = pushPerson();
    let zoo = pushZoo();

    // Prime the relationship and fragment
    const manager = await zoo.manager;
    zoo.star;

    assert.equal(person.title, 'Zoo Manager', 'Person has the right title');
    assert.equal(manager, person, 'Manager relationship was correctly loaded');
    assert.equal(
      zoo.star.name,
      'Sabu',
      'Elephant fragment has the right name.',
    );
    assert.notOk(isUnloaded(person), 'Person is no destroyed');
    assert.notOk(isUnloaded(zoo), 'Zoo is not destroyed');
    assert.notOk(isUnloaded(zoo.star), 'Fragment is not destroyed');

    // Unload the record
    zoo.unloadRecord();

    assert.notOk(isUnloaded(person), 'Person was not unloaded');
    // We'd like to test that the records are unloaded, but the hueristics for that
    // are different between ember-data-2.11, ember-data-2.12, and ember-data-2.13.
    // assert.ok(isUnloaded(zoo), 'Zoo was unloaded');
    // assert.ok(isUnloaded(zoo.get('star')), 'Fragment is now unloaded');

    // Load a new record
    const origZoo = zoo;
    zoo = pushZoo();
    zoo.star; // Prime the fragment on the new model

    // Make sure the reloaded record is new and has the right data
    assert.notOk(isUnloaded(zoo), 'Zoo was unloaded');
    assert.notOk(isUnloaded(zoo.star), 'Fragment is now unloaded');
    const reloadedManager = await zoo.manager;
    assert.equal(
      reloadedManager,
      person,
      'Manager relationship was correctly loaded',
    );
    assert.equal(
      zoo.star.name,
      'Sabu',
      'Elephant fragment has the right name.',
    );

    assert.ok(
      zoo !== origZoo,
      'A different instance of the zoo model was loaded',
    );
    assert.ok(zoo.star !== origZoo.star, 'Fragments were not reused');
  });

  test('can be created with null', async function (assert) {
    const person = store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          name: null,
        },
      },
    });

    assert.strictEqual(person.name, null);
  });

  test('can be updated to null', async function (assert) {
    const person = store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          name: {
            first: 'Eddard',
            last: 'Stark',
          },
        },
      },
    });

    assert.equal(person.name.first, 'Eddard');

    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          name: null,
        },
      },
    });

    assert.equal(person.name, null);
  });

  module('fragment bug when initially set to `null`', function (hooks) {
    let server;
    hooks.beforeEach(function () {
      server = new Pretender();
      server.post('/people', () => {
        return [
          200,
          { 'Content-Type': 'application/json' },
          JSON.stringify({
            person: {
              id: 1,
              title: 'Mr.',
              nickName: 'Johnner',
              names: [{ first: 'John', last: 'Doe' }],
              name: {
                first: 'John',
                last: 'Doe',
                prefixes: [{ name: 'Mr.' }, { name: 'Sir' }],
              },
            },
          }),
        ];
      });
    });

    hooks.afterEach(function () {
      server.shutdown();
    });

    test('`person` fragments/fragment arrays are not initially `null`', async function (assert) {
      const person = store.createRecord('person', {
        title: 'Mr.',
        name: {},
      });

      assert.ok(person.name, 'name is not null');
      assert.ok(person.names, 'names is not null');
      assert.notOk(person.nickName, 'nickName is not set');

      await person.save();

      assert.equal(person.nickName, 'Johnner', 'nickName is correctly loaded');
      assert.deepEqual(
        person.name.serialize(),
        {
          first: 'John',
          last: 'Doe',
          prefixes: [{ name: 'Mr.' }, { name: 'Sir' }],
        },
        'name is correctly loaded',
      );
      assert.deepEqual(
        person.names.serialize(),
        [{ first: 'John', last: 'Doe', prefixes: [] }],
        'names is correct',
      );
    });

    test('`person` fragments/fragment arrays are initially `null`', async function (assert) {
      const person = store.createRecord('person', {
        title: 'Mr.',
        name: null,
        names: null,
      });

      assert.notOk(person.names, 'names is null');
      assert.notOk(person.nickName, 'nickName is not set');

      await person.save();

      assert.equal(person.nickName, 'Johnner', 'nickName is correctly loaded');
      assert.deepEqual(
        person.name.serialize(),
        {
          first: 'John',
          last: 'Doe',
          prefixes: [{ name: 'Mr.' }, { name: 'Sir' }],
        },
        'name is correctly loaded',
      );
      assert.deepEqual(
        person.names.serialize(),
        [{ first: 'John', last: 'Doe', prefixes: [] }],
        'names is correct',
      );
    });
  });

  module('polymorphic', function () {
    module('when updating the type of the model', function () {
      test('it should rebuild the fragment', async function (assert) {
        const zoo = store.push({
          data: {
            type: 'zoo',
            id: 1,
            attributes: {
              name: 'Cincinnati Zoo',
              star: {
                $type: 'elephant',
                name: 'Sabu',
              },
            },
            relationships: {
              manager: {
                data: { type: 'person', id: 1 },
              },
            },
          },
        });

        assert.ok(zoo.star instanceof Elephant);
        assert.strictEqual(zoo.star.name, 'Sabu');

        zoo.star = {
          $type: 'lion',
          hasManes: true,
        };

        assert.ok(zoo.star instanceof Lion);
        assert.strictEqual(zoo.star.name, undefined);
        assert.strictEqual(zoo.star.hasManes, true);
      });
    });
  });
});
