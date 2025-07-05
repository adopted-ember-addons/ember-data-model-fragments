import { module, test } from 'qunit';
import { type TestContext } from '@ember/test-helpers';
import { setupApplicationTest } from '../helpers';
import Pretender from 'pretender';
import { Store } from '../dummy/services/app-store';
import { PersonSchema } from '../dummy/models/person';
import { VehicleSchema } from '../dummy/models/vehicle';

interface AppTestContext extends TestContext {
  store: Store;
}

module('Unit - `Fragment`', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function (this: AppTestContext) {
    this.owner.register('service:store', Store);
    this.store = this.owner.lookup('service:store') as Store;
    this.store.schema.registerResources([PersonSchema, VehicleSchema]);
  });

  test('fragments support toString', function (this: AppTestContext, assert) {
    this.store.push({
      data: {
        type: 'vehicle',
        id: '1',
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

    const vehicle = this.store.peekRecord('vehicle', 1);

    assert.ok(vehicle.passenger.toString().includes('owner(1)'));
    assert.ok(vehicle.passenger.name.toString().includes('owner(null)'));
  });

  test("changes to fragments are indicated in the owner record's `changedAttributes`", async function (this: AppTestContext, assert) {
    this.store.push({
      data: {
        type: 'person',
        id: '1',
        attributes: {
          name: {
            first: 'Loras',
            last: 'Tyrell',
          },
        },
      },
    });

    const person = await this.store.findRecord('person', 1);
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

  test("fragment properties that are set to null are indicated in the owner record's `changedAttributes`", async function (this: AppTestContext, assert) {
    this.store.push({
      data: {
        type: 'person',
        id: '1',
        attributes: {
          name: {
            first: 'Rob',
            last: 'Stark',
          },
        },
      },
    });

    const person = await this.store.findRecord('person', 1);
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

  test("fragment properties that are initially null are indicated in the owner record's `changedAttributes`", async function (this: AppTestContext, assert) {
    this.store.push({
      data: {
        type: 'person',
        id: '1',
        attributes: {
          name: null,
        },
      },
    });

    const person = await this.store.findRecord('person', 1);
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

    person._internalModel.adapterWillCommit();

    const [oldNameAfterWillCommit, newNameAfterWillCommit] =
      person.changedAttributes().name;
    assert.deepEqual(
      oldNameAfterWillCommit,
      null,
      'old fragment is indicated in the diff object',
    );
    assert.deepEqual(
      newNameAfterWillCommit,
      { first: 'Rob', last: 'Stark', prefixes: [] },
      'new fragment is indicated in the diff object',
    );

    person._internalModel.adapterDidCommit();

    assert.strictEqual(
      person.changedAttributes().name,
      undefined,
      'changedAttributes is reset after commit',
    );
  });

  test('changes to attributes can be rolled back', async function (this: AppTestContext, assert) {
    this.store.push({
      data: {
        type: 'person',
        id: '1',
        attributes: {
          name: {
            first: 'Ramsay',
            last: 'Snow',
          },
        },
      },
    });

    const person = await this.store.findRecord('person', 1);
    const name = person.name;

    name.set('last', 'Bolton');
    name.rollbackAttributes();

    assert.strictEqual(name.last, 'Snow', 'fragment properties are restored');
    assert.ok(!name.hasDirtyAttributes, 'fragment is in clean state');
  });

  test('fragments unloaded/reload w/ relationship', function (this: AppTestContext, assert) {
    // Related to: https://github.com/lytics/ember-data-model-fragments/issues/261

    function isUnloaded(recordOrFragment) {
      // Ember-2.13 and newer uses `recordOrFragment.isDestroyed`
      return recordOrFragment.isDestroyed;
    }

    function pushPerson() {
      this.store.push({
        data: {
          type: 'person',
          id: '1',
          attributes: {
            title: 'Zoo Manager',
          },
        },
      });
      return this.store.peekRecord('person', 1);
    }

    function pushZoo() {
      this.store.push({
        data: {
          type: 'zoo',
          id: '1',
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
      return this.store.peekRecord('zoo', 1);
    }

    const person = pushPerson();
    let zoo = pushZoo();

    // Prime the relationship and fragment
    zoo.manager;
    zoo.star;

    assert.equal(person.title, 'Zoo Manager', 'Person has the right title');
    assert.equal(
      zoo.manager.content,
      person,
      'Manager relationship was correctly loaded',
    );
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
    assert.equal(
      zoo.manager.content,
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

  test('can be created with null', async function (this: AppTestContext, assert) {
    const person = this.store.push({
      data: {
        type: 'person',
        id: '1',
        attributes: {
          name: null,
        },
      },
    });

    assert.strictEqual(person.name, null);
  });

  test('can be updated to null', async function (this: AppTestContext, assert) {
    const person = this.store.push({
      data: {
        type: 'person',
        id: '1',
        attributes: {
          name: {
            first: 'Eddard',
            last: 'Stark',
          },
        },
      },
    });

    assert.equal(person.name.first, 'Eddard');

    this.store.push({
      data: {
        type: 'person',
        id: '1',
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
              id: '1',
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

    test('`person` fragments/fragment arrays are not initially `null`', async function (this: AppTestContext, assert) {
      const person = this.store.createRecord('person', {
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

    test('`person` fragments/fragment arrays are initially `null`', async function (this: AppTestContext, assert) {
      const person = this.store.createRecord('person', {
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
});
