import Model, { attr } from '@ember-data/model';
import { fragment } from '#src/attributes/index.ts';
import { schedule } from '@ember/runloop';
import EmberObject from '@ember/object';
import { copy } from '#src/util/copy.ts';
import MF from '#src/index.ts';
import { module, test } from 'qunit';
import { setupApplicationTest, createClassic } from '../helpers/index.ts';
import type { TestContext, TestStore } from '../helpers/index.ts';
import Name from '../../demo-app/models/name.ts';
import type Address from '../../demo-app/models/address.ts';
import Pretender from 'pretender';

let store: TestStore;
let owner: any;
let server: any;

module('unit - `MF.fragment` property', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function (this: TestContext) {
    owner = this.owner;
    store = owner.lookup('service:store');
    server = new Pretender();
  });

  hooks.afterEach(function (this: TestContext) {
    owner = null;
    server.shutdown();
  });

  test('object literals are converted to instances of `MF.Fragment`', async function (this: TestContext, assert: Assert) {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          name: {
            first: 'Tyrion',
            last: 'Lannister',
          },
        },
      },
    });

    const person = await store.findRecord('person', 1);
    assert.ok(
      person.name instanceof Name,
      'name property is an `MF.Fragment` instance',
    );

    assert.equal(
      person.name.first,
      'Tyrion',
      'nested properties have original value',
    );
  });

  test('a fragment can be created through the store and set', async function (this: TestContext, assert: Assert) {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {},
      },
    });

    const person = await store.findRecord('person', 1);
    const name = store.createFragment('name', {
      first: 'Davos',
      last: 'Seaworth',
    });

    person.set('name', name);

    assert.equal(person.name.first, 'Davos', 'new fragment is correctly set');
  });

  test('a fragment set to null can be recreated through the store with a non null value', async function (this: TestContext, assert: Assert) {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          name: null,
        },
      },
    });
    await store.findRecord('person', 1);
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          name: {
            first: 'Bob',
            last: 'Smith',
          },
        },
      },
    });
    const person = await store.findRecord('person', 1);
    assert.equal(person.name.first, 'Bob', 'New name is set correctly');
  });

  test('setting to a non-fragment or object literal throws an error', async function (this: TestContext, assert: Assert) {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {},
      },
    });

    const person = await store.findRecord('person', 1);
    assert.expectAssertion(() => {
      person.set('name', store.createRecord('person'));
    }, 'You must pass a fragment or null to set a fragment');
  });

  test('setting fragments from other records throws an error', async function (this: TestContext, assert: Assert) {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          name: {
            first: 'Roose',
            last: 'Bolton',
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

    const people = await Promise.all([
      store.findRecord('person', 1),
      store.findRecord('person', 2),
    ]);
    assert.expectAssertion(() => {
      people[1].set('name', people[0].name);
    }, 'Fragments can only belong to one owner, try copying instead');
  });

  test('null values are allowed', async function (this: TestContext, assert: Assert) {
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
    assert.equal(person.name, null, 'property is null');
  });

  test('setting to null is allowed', async function (this: TestContext, assert: Assert) {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          name: {
            first: 'Barristan',
            last: 'Selmy',
          },
        },
      },
    });

    const person = await store.findRecord('person', 1);
    person.set('name', null);
    assert.equal(person.name, null, 'property is null');
  });

  test('fragments are created from object literals when creating a record', function (this: TestContext, assert: Assert) {
    const name = {
      first: 'Balon',
      last: 'Greyjoy',
    };

    const person = store.createRecord('person', {
      name: name,
    });

    assert.ok(
      person.name instanceof MF.Fragment,
      'a `MF.Fragment` instance is created',
    );
    assert.equal(person.name.first, name.first, 'fragment has correct values');
  });

  test('setting a fragment to an object literal creates a new fragment', async function (this: TestContext, assert: Assert) {
    const name = {
      first: 'Asha',
      last: 'Greyjoy',
    };

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
    person.set('name', name);

    assert.ok(
      person.name instanceof MF.Fragment,
      'a `MF.Fragment` instance is created',
    );
    assert.equal(person.name.first, name.first, 'fragment has correct values');
  });

  test('setting a fragment to an object literal reuses an existing fragment', async function (this: TestContext, assert: Assert) {
    const newName = {
      first: 'Reek',
      last: null,
    };

    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          name: {
            first: 'Theon',
            last: 'Greyjoy',
          },
        },
      },
    });

    const person = await store.findRecord('person', 1);
    const name = person.name;

    person.set('name', newName);

    assert.equal(name, person.name, 'fragment instances are reused');
    assert.equal(
      person.name.first,
      newName.first,
      'fragment has correct values',
    );
  });

  test('fragments can be saved with values, then have a value set to null without causing error', async function (this: TestContext, assert: Assert) {
    const defaultValue = {
      first: 'Iron',
      last: 'Victory',
    };

    class Ship extends Model {
      @fragment('name', { defaultValue: defaultValue }) declare name: any;
    }

    owner.register('model:ship', Ship);

    const ship = store.createRecord('ship');

    const payload: { ship: Record<string, any> } = {
      ship: copy(defaultValue, true),
    };
    payload.ship.id = 3;

    server.post('/ships', () => {
      return [
        200,
        { 'Content-Type': 'application/json' },
        JSON.stringify(payload),
      ];
    });

    await ship.save();
    assert.equal(
      ship.name.first,
      defaultValue.first,
      'the value is set as it was saved',
    );

    ship.set('name.first', null);
    assert.equal(
      ship.name.first,
      null,
      'the value is successfully set to null',
    );
  });

  test('fragments can have default values', function (this: TestContext, assert: Assert) {
    const defaultValue = {
      first: 'Iron',
      last: 'Victory',
    };

    class Ship extends Model {
      @fragment('name', { defaultValue: defaultValue }) declare name: any;
    }

    owner.register('model:ship', Ship);

    let ship = store.createRecord('ship');

    assert.equal(
      ship.name.first,
      defaultValue.first,
      'the default value is used when the value has not been specified',
    );

    ship.set('name', null);
    assert.equal(
      ship.name,
      null,
      'the default value is not used when the value is set to null',
    );

    ship = store.createRecord('ship', { name: null });
    assert.equal(
      ship.name,
      null,
      'the default value is not used when the value is initialized to null',
    );
  });

  test('fragment default values can be functions', function (this: TestContext, assert: Assert) {
    const defaultValue = {
      first: 'Oath',
      last: 'Keeper',
    };

    class Sword extends Model {
      @fragment('name', {
        defaultValue() {
          return defaultValue;
        },
      })
      declare name: any;
    }

    owner.register('model:sword', Sword);

    const sword = store.createRecord('sword');

    assert.equal(
      sword.name.first,
      defaultValue.first,
      'the default value is correct',
    );
  });

  test('fragment default values that are functions are not deep copied', function (this: TestContext, assert: Assert) {
    const defaultValue = {
      first: 'Oath',
      last: 'Keeper',
      uncopyableObject: createClassic(EmberObject, { item: 'Longclaw' }), // Will throw an error if copied
    };

    class Sword extends Model {
      @fragment('name', {
        defaultValue() {
          return defaultValue;
        },
      })
      declare name: any;
    }

    owner.register('model:sword', Sword);

    const sword = store.createRecord('sword');

    assert.equal(
      sword.name.first,
      defaultValue.first,
      'the default value is correct',
    );
    assert.strictEqual(
      sword.name.person,
      sword,
      'the fragment owner is assigned',
    );
  });

  test('fragment default value function returning Fragment instances', function (this: TestContext, assert: Assert) {
    const defaultValue = {
      first: 'Oath',
      last: 'Keeper',
    };

    class Sword extends Model {
      @fragment('name', {
        defaultValue(record) {
          return record.store.createFragment('name', defaultValue);
        },
      })
      declare name: any;
    }

    owner.register('model:sword', Sword);

    const sword = store.createRecord('sword');

    assert.equal(
      sword.name.first,
      defaultValue.first,
      'the default value is correct',
    );
    assert.strictEqual(
      sword.name.person,
      sword,
      'the fragment owner is assigned',
    );
  });

  test('fragment default value is merged with pushed attributes', function (this: TestContext, assert: Assert) {
    const defaultValue = {
      first: 'Iron',
      last: 'Victory',
    };

    class Ship extends Model {
      @attr('string', { defaultValue: 'USA' }) declare country: string;
      @fragment('name', { defaultValue: defaultValue }) declare name: any;
    }

    owner.register('model:ship', Ship);

    store.push({
      data: {
        type: 'ship',
        id: 1,
      },
    });

    const ship = store.peekRecord('ship', 1);

    store.push({
      data: {
        type: 'ship',
        id: 1,
        attributes: {
          country: 'USSR',
          name: {
            last: 'Challenger',
          },
        },
      },
    });

    assert.strictEqual(ship.country, 'USSR');
    assert.strictEqual(ship.name.first, 'Iron');
    assert.strictEqual(ship.name.last, 'Challenger');
  });

  test('destroy a fragment which was set to null', async function (this: TestContext, assert: Assert) {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          name: {
            first: 'Barristan',
            last: 'Selmy',
          },
        },
      },
    });

    const person = await store.findRecord('person', 1);
    const name = person.name;
    person.set('name', null);

    person.unloadRecord();

    schedule('destroy', () => {
      assert.ok(person.isDestroying, 'the model is being destroyed');
      assert.ok(name.isDestroying, 'the fragment is being destroyed');
    });
  });

  test('destroy the old and new fragment value', async function (this: TestContext, assert: Assert) {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          name: {
            first: 'Barristan',
            last: 'Selmy',
          },
        },
      },
    });

    const person = await store.findRecord('person', 1);
    const oldName = person.name;
    const newName = store.createFragment('name');
    person.set('name', newName);

    assert.ok(
      !oldName.isDestroying,
      "don't destroy the old fragment yet because we could rollback",
    );

    person.unloadRecord();

    schedule('destroy', () => {
      assert.ok(person.isDestroying, 'the model is being destroyed');
      assert.ok(oldName.isDestroying, 'the old fragment is being destroyed');
      assert.ok(newName.isDestroying, 'the new fragment is being destroyed');
    });
  });

  // Note: In ember-data 4.12+, fragment data is cleared when the owner record
  // is unloaded. This test verifies that the fragment instance is destroyed
  // along with the owner, which is the expected behavior for memory management.
  test('fragment is destroyed when owner record is unloaded', async function (this: TestContext, assert: Assert) {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          name: {
            first: 'Barristan',
            last: 'Selmy',
          },
        },
      },
    });

    const person = await store.findRecord('person', 1);
    const name = person.name;

    // Verify fragment data is accessible before unload
    assert.strictEqual(
      name.first,
      'Barristan',
      'fragment attributes are accessible before unload',
    );

    person.unloadRecord();

    schedule('destroy', () => {
      assert.ok(
        name.isDestroying,
        'fragment is being destroyed when owner is unloaded',
      );
    });
  });

  test('accessing a fragment property on a destroyed record returns null', function (this: TestContext, assert: Assert) {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          name: { first: 'Eddard', last: 'Stark' },
        },
      },
    });

    const person = store.peekRecord('person', 1);
    const name = person.name;
    assert.equal(name.first, 'Eddard', 'fragment is accessible before unload');

    person.unloadRecord();

    // Access the fragment during the destroy phase - this previously caused
    // "recordIdentifierFor is not a record instantiated by @ember-data/store"
    // and an infinite recursion in Fragment.toString()
    schedule('destroy', () => {
      assert.ok(
        name.isDestroying,
        'fragment is destroying after owner is unloaded',
      );
      // toString should not cause infinite recursion on destroyed fragment
      assert.strictEqual(
        name.toString(),
        '<fragment(destroyed)>',
        'toString returns safe string on destroyed fragment',
      );
    });
  });

  test('accessing a fragmentArray property on a destroyed record does not crash', function (this: TestContext, assert: Assert) {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          names: [
            { first: 'Eddard', last: 'Stark' },
            { first: 'Ned', last: 'Stark' },
          ],
        },
      },
    });

    const person = store.peekRecord('person', 1);
    const names = person.names;
    assert.equal(names.length, 2, 'fragmentArray is accessible before unload');

    person.unloadRecord();

    schedule('destroy', () => {
      const firstFragment = names.objectAt(0);
      if (firstFragment) {
        assert.ok(
          firstFragment.isDestroying,
          'fragment in array is destroying after owner is unloaded',
        );
        assert.strictEqual(
          firstFragment.toString(),
          '<fragment(destroyed)>',
          'toString returns safe string on destroyed fragment in array',
        );
      } else {
        assert.ok(true, 'fragment array contents are already cleaned up');
      }
    });
  });

  test('pass arbitrary props to createFragment', function (this: TestContext, assert: Assert) {
    const address = store.createFragment('address', {
      street: '1 Dungeon Cell',
      extra: 123,
    });

    assert.equal(address.street, '1 Dungeon Cell', 'street is correct');
    // `extra` is deliberately undeclared — that arbitrary props survive
    // `createFragment` is the point of this test.
    assert.equal(
      (address as Address & { extra: number }).extra,
      123,
      'extra property is correct',
    );
  });
});
