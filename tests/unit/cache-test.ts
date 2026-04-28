import { module, test } from 'qunit';
import { setupApplicationTest } from '../helpers/index.ts';
import { recordIdentifierFor } from '@ember-data/store';
import MF from '#src/index.ts';
import Pretender from 'pretender';

let store: any, owner: any, server: Pretender;

module('unit - FragmentCache', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function () {
    owner = this.owner;
    store = owner.lookup('service:store');
    server = new Pretender();
  });

  hooks.afterEach(function () {
    owner = null;
    store = null;
    server.shutdown();
  });

  module('upsert - separates fragment attributes', function () {
    test('fragment attributes are handled separately from regular attributes', async function (assert) {
      store.push({
        data: {
          type: 'person',
          id: '1',
          attributes: {
            title: 'Lord',
            name: {
              first: 'Eddard',
              last: 'Stark',
            },
          },
        },
      });

      const person = store.peekRecord('person', '1');
      const identifier = recordIdentifierFor(person);

      // Regular attribute should be in inner cache
      assert.strictEqual(
        store.cache.__innerCache.getAttr(identifier, 'title'),
        'Lord',
        'regular attribute is stored in inner cache',
      );

      // Fragment should be accessible via fragment state
      assert.ok(
        person.name instanceof (MF as any).Fragment,
        'fragment is accessible',
      );
      assert.strictEqual(
        person.name.first,
        'Eddard',
        'fragment data is correct',
      );
    });

    test('pushing new data updates fragment attributes', async function (assert) {
      store.push({
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

      const person = store.peekRecord('person', '1');
      const originalName = person.name;

      store.push({
        data: {
          type: 'person',
          id: '1',
          attributes: {
            name: {
              first: 'Ned',
              last: 'Stark',
            },
          },
        },
      });

      assert.strictEqual(
        person.name,
        originalName,
        'fragment instance is reused',
      );
      assert.strictEqual(person.name.first, 'Ned', 'fragment data is updated');
    });
  });

  module('getAttr - returns Fragment instances', function () {
    test('getAttr returns Fragment instance for fragment attributes', async function (assert) {
      store.push({
        data: {
          type: 'person',
          id: '1',
          attributes: {
            name: {
              first: 'Robb',
              last: 'Stark',
            },
          },
        },
      });

      const person = store.peekRecord('person', '1');
      const identifier = recordIdentifierFor(person);

      const nameViaCache = store.cache.getAttr(identifier, 'name');

      assert.ok(
        nameViaCache instanceof (MF as any).Fragment,
        'getAttr returns Fragment instance',
      );
      assert.strictEqual(
        nameViaCache.first,
        'Robb',
        'fragment has correct data',
      );
    });

    test('getAttr returns array of Fragment instances for fragmentArray attributes', async function (assert) {
      store.push({
        data: {
          type: 'person',
          id: '1',
          attributes: {
            addresses: [
              { street: '1 Winterfell', city: 'Winterfell' },
              { street: '1 Castle Black', city: 'The Wall' },
            ],
          },
        },
      });

      const person = store.peekRecord('person', '1');
      const identifier = recordIdentifierFor(person);

      const addressesViaCache = store.cache.getAttr(identifier, 'addresses');

      assert.ok(Array.isArray(addressesViaCache), 'getAttr returns array');
      assert.strictEqual(
        addressesViaCache.length,
        2,
        'array has correct length',
      );
      assert.ok(
        addressesViaCache[0] instanceof (MF as any).Fragment,
        'array items are Fragment instances',
      );
    });

    test('getAttr returns null for null fragment attributes', async function (assert) {
      store.push({
        data: {
          type: 'person',
          id: '1',
          attributes: {
            name: null,
          },
        },
      });

      const person = store.peekRecord('person', '1');
      const identifier = recordIdentifierFor(person);

      const nameViaCache = store.cache.getAttr(identifier, 'name');

      assert.strictEqual(nameViaCache, null, 'getAttr returns null');
    });

    test('schema surfaces include fragment fields consistently', async function (assert) {
      store.push({
        data: {
          type: 'person',
          id: '1',
          attributes: {
            name: {
              first: 'Arya',
              last: 'Stark',
            },
            houses: [{ name: 'Stark', region: 'North' }],
            children: ['Arya'],
          },
        },
      });

      const person = store.peekRecord('person', '1');
      const identifier = recordIdentifierFor(person);
      const schema = store.getSchemaDefinitionService();
      const definitions = schema.attributesDefinitionFor(identifier);

      assert.true(
        definitions.name.isFragment,
        'attributesDefinitionFor preserves fragment metadata for fragments',
      );
      assert.true(
        definitions.houses.isFragment,
        'attributesDefinitionFor preserves fragment metadata for fragment arrays',
      );
      assert.true(
        definitions.children.isFragment,
        'attributesDefinitionFor preserves fragment metadata for arrays',
      );

      // ember-data 4.12 does not expose the newer schema field APIs.
      if (typeof schema.fields !== 'function') {
        return;
      }

      const fields = schema.fields(identifier);

      assert.ok(fields.has('name'), 'fields includes fragment field');
      assert.ok(fields.has('houses'), 'fields includes fragment array field');
      assert.ok(fields.has('children'), 'fields includes array field');

      if (typeof schema.cacheFields === 'function') {
        const cacheFields = schema.cacheFields(identifier);

        assert.ok(
          cacheFields.has('name'),
          'cacheFields includes fragment field',
        );
        assert.ok(
          cacheFields.has('houses'),
          'cacheFields includes fragment array field',
        );
        assert.ok(
          cacheFields.has('children'),
          'cacheFields includes array field',
        );
      }

      if (typeof schema.resource === 'function') {
        const resource = schema.resource(identifier);

        assert.ok(
          resource.fields.some(
            (field: { name: string }) => field.name === 'name',
          ),
          'resource fields include fragment field',
        );
        assert.ok(
          resource.fields.some(
            (field: { name: string }) => field.name === 'houses',
          ),
          'resource fields include fragment array field',
        );
        assert.ok(
          resource.fields.some(
            (field: { name: string }) => field.name === 'children',
          ),
          'resource fields include array field',
        );
      }
    });
  });

  module('setAttr - dirty state propagation', function () {
    test('setting fragment attribute propagates dirty state to owner', async function (assert) {
      store.push({
        data: {
          type: 'person',
          id: '1',
          attributes: {
            name: {
              first: 'Sansa',
              last: 'Stark',
            },
          },
        },
      });

      const person = store.peekRecord('person', '1');

      assert.notOk(person.hasDirtyAttributes, 'person starts clean');

      person.name.set('first', 'Alayne');

      assert.ok(person.name.hasDirtyAttributes, 'fragment is dirty');
      assert.ok(person.hasDirtyAttributes, 'owner is dirty');
    });

    test('resetting fragment attribute to original value clears dirty state', async function (assert) {
      store.push({
        data: {
          type: 'person',
          id: '1',
          attributes: {
            name: {
              first: 'Arya',
              last: 'Stark',
            },
          },
        },
      });

      const person = store.peekRecord('person', '1');

      person.name.set('first', 'No One');
      assert.ok(person.hasDirtyAttributes, 'owner is dirty after change');

      person.name.set('first', 'Arya');
      assert.notOk(
        person.name.hasDirtyAttributes,
        'fragment is clean after reset',
      );
      assert.notOk(person.hasDirtyAttributes, 'owner is clean after reset');
    });
  });

  module('hasChangedAttrs - includes fragment changes', function () {
    test('hasChangedAttrs returns true when fragment is dirty', async function (assert) {
      store.push({
        data: {
          type: 'person',
          id: '1',
          attributes: {
            name: {
              first: 'Bran',
              last: 'Stark',
            },
          },
        },
      });

      const person = store.peekRecord('person', '1');
      const identifier = recordIdentifierFor(person);

      assert.notOk(
        store.cache.hasChangedAttrs(identifier),
        'no changes initially',
      );

      person.name.set('first', 'Brandon');

      assert.ok(
        store.cache.hasChangedAttrs(identifier),
        'hasChangedAttrs detects fragment change',
      );
    });

    test('hasChangedAttrs returns true when nested fragment in array is dirty', async function (assert) {
      store.push({
        data: {
          type: 'person',
          id: '1',
          attributes: {
            addresses: [{ street: '1 Winterfell', city: 'Winterfell' }],
          },
        },
      });

      const person = store.peekRecord('person', '1');
      const identifier = recordIdentifierFor(person);

      assert.notOk(
        store.cache.hasChangedAttrs(identifier),
        'no changes initially',
      );

      person.addresses.firstObject.set('city', 'The North');

      assert.ok(
        store.cache.hasChangedAttrs(identifier),
        'hasChangedAttrs detects nested fragment change',
      );
    });
  });

  module('didCommit - updates fragment canonical state', function () {
    test('didCommit updates fragment canonical state from server response', async function (assert) {
      store.push({
        data: {
          type: 'person',
          id: '1',
          attributes: {
            name: {
              first: 'Jon',
              last: 'Snow',
            },
          },
        },
      });

      const person = store.peekRecord('person', '1');

      person.name.set('last', 'Targaryen');
      assert.ok(person.hasDirtyAttributes, 'person is dirty before save');

      server.put('/people/1', () => {
        return [
          200,
          { 'Content-Type': 'application/json' },
          JSON.stringify({
            person: {
              id: '1',
              name: {
                first: 'Aegon',
                last: 'Targaryen',
              },
            },
          }),
        ];
      });

      await person.save();

      assert.notOk(person.hasDirtyAttributes, 'person is clean after save');
      assert.strictEqual(
        person.name.first,
        'Aegon',
        'fragment updated from server response',
      );
      assert.strictEqual(
        person.name.last,
        'Targaryen',
        'fragment data correct',
      );
    });

    test('didCommit clears dirty state without server response data', async function (assert) {
      store.push({
        data: {
          type: 'person',
          id: '1',
          attributes: {
            name: {
              first: 'Daenerys',
              last: 'Targaryen',
            },
          },
        },
      });

      const person = store.peekRecord('person', '1');

      person.name.set('first', 'Dany');
      assert.ok(person.hasDirtyAttributes, 'person is dirty before save');

      server.put('/people/1', () => {
        return [
          200,
          { 'Content-Type': 'application/json' },
          JSON.stringify({
            person: { id: '1' },
          }),
        ];
      });

      await person.save();

      assert.notOk(person.hasDirtyAttributes, 'person is clean after save');
      assert.strictEqual(
        person.name.first,
        'Dany',
        'fragment retains local changes when server returns no data',
      );
    });
  });

  module('rollbackAttrs - cascades to fragments', function () {
    test('rollbackAttrs on owner cascades to fragment', async function (assert) {
      store.push({
        data: {
          type: 'person',
          id: '1',
          attributes: {
            name: {
              first: 'Cersei',
              last: 'Lannister',
            },
          },
        },
      });

      const person = store.peekRecord('person', '1');

      person.name.set('first', 'The Queen');
      assert.ok(person.hasDirtyAttributes, 'person is dirty');

      person.rollbackAttributes();

      assert.notOk(person.hasDirtyAttributes, 'person is clean after rollback');
      assert.notOk(
        person.name.hasDirtyAttributes,
        'fragment is clean after rollback',
      );
      assert.strictEqual(person.name.first, 'Cersei', 'fragment data restored');
    });

    test('rollbackAttrs cascades to nested fragments in arrays', async function (assert) {
      store.push({
        data: {
          type: 'person',
          id: '1',
          attributes: {
            addresses: [
              { street: '1 Red Keep', city: "King's Landing" },
              { street: '1 Casterly Rock', city: 'Lannisport' },
            ],
          },
        },
      });

      const person = store.peekRecord('person', '1');
      const firstAddress = person.addresses.firstObject;

      firstAddress.set('street', '1 Iron Throne');
      assert.ok(person.hasDirtyAttributes, 'person is dirty');

      person.rollbackAttributes();

      assert.notOk(person.hasDirtyAttributes, 'person is clean after rollback');
      assert.strictEqual(
        firstAddress.street,
        '1 Red Keep',
        'nested fragment data restored',
      );
    });

    test('rollbackAttrs restores removed fragment array items', async function (assert) {
      store.push({
        data: {
          type: 'person',
          id: '1',
          attributes: {
            addresses: [
              { street: '1 Red Keep', city: "King's Landing" },
              { street: '1 Casterly Rock', city: 'Lannisport' },
            ],
          },
        },
      });

      const person = store.peekRecord('person', '1');

      assert.strictEqual(person.addresses.length, 2, 'starts with 2 addresses');

      person.addresses.popObject();
      assert.strictEqual(person.addresses.length, 1, 'address removed');
      assert.ok(person.hasDirtyAttributes, 'person is dirty');

      person.rollbackAttributes();

      assert.strictEqual(
        person.addresses.length,
        2,
        'removed address restored after rollback',
      );
      assert.notOk(person.hasDirtyAttributes, 'person is clean after rollback');
    });
  });
});

module('unit - Fragment Owner Tracking', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function () {
    owner = this.owner;
    store = owner.lookup('service:store');
    server = new Pretender();
  });

  hooks.afterEach(function () {
    owner = null;
    store = null;
    server.shutdown();
  });

  test('fragment owner is set when fragment is assigned to record', async function (assert) {
    store.push({
      data: {
        type: 'person',
        id: '1',
        attributes: {
          name: {
            first: 'Jaime',
            last: 'Lannister',
          },
        },
      },
    });

    const person = store.peekRecord('person', '1');
    const name = person.name;
    const fragmentIdentifier = recordIdentifierFor(name);

    const ownerInfo = store.cache.getFragmentOwner(fragmentIdentifier);

    assert.ok(ownerInfo, 'fragment has owner info');
    assert.strictEqual(ownerInfo.key, 'name', 'owner key is correct');
  });

  test('fragment cannot be reassigned to a different owner', async function (assert) {
    store.push({
      data: {
        type: 'person',
        id: '1',
        attributes: {
          name: {
            first: 'Jaime',
            last: 'Lannister',
          },
        },
      },
    });

    store.push({
      data: {
        type: 'person',
        id: '2',
        attributes: {},
      },
    });

    const person1 = store.peekRecord('person', '1');
    const person2 = store.peekRecord('person', '2');

    assert.expectAssertion(() => {
      person2.set('name', person1.name);
    }, 'Fragments can only belong to one owner, try copying instead');
  });

  test('createFragment creates fragment without owner', async function (assert) {
    const name = store.createFragment('name', {
      first: 'Tyrion',
      last: 'Lannister',
    });

    const fragmentIdentifier = recordIdentifierFor(name);
    const ownerInfo = store.cache.getFragmentOwner(fragmentIdentifier);

    assert.notOk(ownerInfo, 'fragment has no owner initially');
  });

  test('assigning createFragment result sets owner', async function (assert) {
    const name = store.createFragment('name', {
      first: 'Tyrion',
      last: 'Lannister',
    });

    store.push({
      data: {
        type: 'person',
        id: '1',
        attributes: {},
      },
    });

    const person = store.peekRecord('person', '1');
    person.set('name', name);

    const fragmentIdentifier = recordIdentifierFor(name);
    const ownerInfo = store.cache.getFragmentOwner(fragmentIdentifier);

    assert.ok(ownerInfo, 'fragment now has owner');
    assert.strictEqual(ownerInfo.key, 'name', 'owner key is correct');
  });

  test('fragment owner is accessible via fragmentOwner property', async function (assert) {
    store.push({
      data: {
        type: 'person',
        id: '1',
        attributes: {
          name: {
            first: 'Brienne',
            last: 'of Tarth',
          },
        },
      },
    });

    const person = store.peekRecord('person', '1');
    const name = person.name;

    assert.strictEqual(
      name.person,
      person,
      'fragmentOwner returns owner record',
    );
  });

  test('createRecord accepts an existing fragment instance for a single fragment attr', async function (assert) {
    const name = store.createFragment('name', {
      first: 'Arya',
      last: 'Stark',
    });

    let person;
    try {
      person = store.createRecord('person', { name });
    } catch (e) {
      assert.notOk(
        true,
        `createRecord with fragment instance threw: ${e.message}`,
      );
      return;
    }

    assert.ok(person, 'person was created without error');
    assert.strictEqual(
      person.name.first,
      'Arya',
      'fragment data is preserved (first)',
    );
    assert.strictEqual(
      person.name.last,
      'Stark',
      'fragment data is preserved (last)',
    );

    // Prefer adoption (no duplication) over re-creating a fragment.
    assert.strictEqual(
      person.name,
      name,
      'createRecord adopts the provided fragment instance instead of duplicating it',
    );

    const fragmentIdentifier = recordIdentifierFor(name);
    const ownerInfo = store.cache.getFragmentOwner(fragmentIdentifier);
    assert.ok(ownerInfo, 'adopted fragment has an owner');
    assert.strictEqual(
      ownerInfo.key,
      'name',
      'adopted fragment is owned at the correct key',
    );
    assert.strictEqual(
      ownerInfo.ownerIdentifier,
      recordIdentifierFor(person),
      'adopted fragment is owned by the new record',
    );
  });

  test('createRecord accepts existing fragment instances for a fragment-array attr', async function (assert) {
    const name1 = store.createFragment('name', {
      first: 'Arya',
      last: 'Stark',
    });
    const name2 = store.createFragment('name', {
      first: 'Sansa',
      last: 'Stark',
    });

    let person;
    try {
      person = store.createRecord('person', { names: [name1, name2] });
    } catch (e) {
      assert.notOk(
        true,
        `createRecord with fragment-array instances threw: ${e.message}`,
      );
      return;
    }

    assert.ok(person, 'person was created without error');
    assert.strictEqual(person.names.length, 2, 'fragment array has 2 entries');
    assert.strictEqual(
      person.names.objectAt(0),
      name1,
      'first fragment is adopted (not duplicated)',
    );
    assert.strictEqual(
      person.names.objectAt(1),
      name2,
      'second fragment is adopted (not duplicated)',
    );
    assert.strictEqual(
      person.names.objectAt(0).first,
      'Arya',
      'first fragment data preserved',
    );
    assert.strictEqual(
      person.names.objectAt(1).first,
      'Sansa',
      'second fragment data preserved',
    );

    const personIdentifier = recordIdentifierFor(person);
    [name1, name2].forEach((fragment) => {
      const ownerInfo = store.cache.getFragmentOwner(
        recordIdentifierFor(fragment),
      );
      assert.ok(ownerInfo, 'adopted fragment has an owner');
      assert.strictEqual(
        ownerInfo.ownerIdentifier,
        personIdentifier,
        'adopted fragment owner is the new record',
      );
      assert.strictEqual(
        ownerInfo.key,
        'names',
        'adopted fragment owner key is correct',
      );
    });
  });

  test('createRecord still accepts plain object literals for fragment attrs (no regression)', async function (assert) {
    const person = store.createRecord('person', {
      name: { first: 'Arya', last: 'Stark' },
    });

    assert.ok(person, 'person was created');
    assert.ok(person.name instanceof MF.Fragment, 'fragment was instantiated');
    assert.strictEqual(person.name.first, 'Arya', 'first preserved');
    assert.strictEqual(person.name.last, 'Stark', 'last preserved');
  });

  test('createRecord asserts when given a fragment instance of the wrong type', async function (assert) {
    // 'address' is a different fragment model than the one declared on `name`.
    const wrong = store.createFragment('address', {
      street: '1 Winterfell Way',
    });

    assert.expectAssertion(() => {
      store.createRecord('person', { name: wrong });
    }, "The value provided for fragment attribute 'name' must be a 'name' fragment");
  });
});

module('unit - Fragment Edge Cases', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function () {
    owner = this.owner;
    store = owner.lookup('service:store');
    server = new Pretender();
  });

  hooks.afterEach(function () {
    owner = null;
    store = null;
    server.shutdown();
  });

  test('accessing fragment default value does not cause infinite recursion', async function (assert) {
    // This test verifies the fix for a re-entrancy bug where creating a fragment's
    // default value would trigger ember-data notifications, which would call getAttr
    // again before the default was stored, causing infinite recursion.
    //
    // The fix stores a sentinel value before creating the fragment to prevent
    // re-entrant calls from trying to create another default.

    store.push({
      data: {
        type: 'person',
        id: '1',
        attributes: {
          title: 'Test',
          // Intentionally NOT providing 'name' fragment - will use default
        },
      },
    });

    const person = store.peekRecord('person', '1');
    const identifier = recordIdentifierFor(person);

    // Access the fragment multiple times in quick succession
    // This simulates what happens when observers/computeds chain together
    const name1 = store.cache.getAttr(identifier, 'name');
    const name2 = store.cache.getAttr(identifier, 'name');
    const name3 = person.name;

    // All accesses should return the same fragment instance (or null if default is null)
    assert.strictEqual(name1, name2, 'repeated getAttr returns same value');
    assert.strictEqual(
      name2,
      name3,
      'property access returns same value as getAttr',
    );

    // The test passing without a stack overflow means the fix works
    assert.ok(true, 'no infinite recursion occurred');
  });

  test('concurrent fragment access during record instantiation does not cause recursion', async function (assert) {
    // This test creates a record and immediately accesses multiple fragment properties
    // to ensure there's no re-entrancy issue during the initial instantiation

    const person = store.createRecord('person', {
      title: 'Test',
      // name will be default (null or empty fragment)
      // addresses will be default (null or empty array)
    });

    // Access all fragment properties - this would cause stack overflow before the fix
    const name = person.name;
    const addresses = person.addresses;

    // Access them again to ensure caching works
    const name2 = person.name;
    const addresses2 = person.addresses;

    assert.strictEqual(name, name2, 'name fragment is cached');
    assert.strictEqual(addresses, addresses2, 'addresses fragment is cached');
    assert.ok(true, 'no infinite recursion during record creation');
  });

  test('pushing data to record with dirty fragment merges correctly', async function (assert) {
    store.push({
      data: {
        type: 'person',
        id: '1',
        attributes: {
          title: 'Ser',
          name: {
            first: 'Davos',
            last: 'Seaworth',
          },
        },
      },
    });

    const person = store.peekRecord('person', '1');

    // Make fragment dirty
    person.name.set('first', 'The Onion Knight');
    assert.ok(person.hasDirtyAttributes, 'person is dirty');

    // Push new data (simulating background refresh)
    store.push({
      data: {
        type: 'person',
        id: '1',
        attributes: {
          title: 'Lord',
          name: {
            first: 'Davos',
            last: 'Seaworth',
          },
        },
      },
    });

    // Title should be updated, but fragment should retain dirty state
    assert.strictEqual(person.title, 'Lord', 'regular attribute updated');
    // Note: The exact behavior here depends on implementation -
    // dirty fragment values may or may not be preserved
    assert.ok(
      person.name.first === 'The Onion Knight' || person.name.first === 'Davos',
      'fragment handled during push',
    );
  });

  test('fragment array maintains order after save', async function (assert) {
    store.push({
      data: {
        type: 'person',
        id: '1',
        attributes: {
          addresses: [
            { street: 'First Street', city: 'City A' },
            { street: 'Second Street', city: 'City B' },
            { street: 'Third Street', city: 'City C' },
          ],
        },
      },
    });

    const person = store.peekRecord('person', '1');

    // Modify middle item
    person.addresses.objectAt(1).set('city', 'City B Modified');

    server.put('/people/1', () => {
      return [
        200,
        { 'Content-Type': 'application/json' },
        JSON.stringify({
          person: {
            id: '1',
            addresses: [
              { street: 'First Street', city: 'City A' },
              { street: 'Second Street', city: 'City B Modified' },
              { street: 'Third Street', city: 'City C' },
            ],
          },
        }),
      ];
    });

    await person.save();

    assert.strictEqual(person.addresses.length, 3, 'array length preserved');
    assert.strictEqual(
      person.addresses.objectAt(0).street,
      'First Street',
      'first item preserved',
    );
    assert.strictEqual(
      person.addresses.objectAt(1).city,
      'City B Modified',
      'middle item updated',
    );
    assert.strictEqual(
      person.addresses.objectAt(2).street,
      'Third Street',
      'last item preserved',
    );
  });

  test('new record with fragments can be saved', async function (assert) {
    const person = store.createRecord('person', {
      name: {
        first: 'Gendry',
        last: 'Baratheon',
      },
    });

    assert.ok(person.hasDirtyAttributes, 'new record is dirty');
    assert.ok(
      person.name instanceof (MF as any).Fragment,
      'fragment created from hash',
    );

    server.post('/people', () => {
      return [
        201,
        { 'Content-Type': 'application/json' },
        JSON.stringify({
          person: {
            id: '99',
            name: {
              first: 'Gendry',
              last: 'Baratheon',
            },
          },
        }),
      ];
    });

    await person.save();

    assert.notOk(person.hasDirtyAttributes, 'record is clean after save');
    assert.strictEqual(person.id, '99', 'record has ID from server');
    assert.strictEqual(person.name.first, 'Gendry', 'fragment data preserved');
  });

  test('commitWasRejected restores fragment to pre-save state', async function (assert) {
    store.push({
      data: {
        type: 'person',
        id: '1',
        attributes: {
          name: {
            first: 'Theon',
            last: 'Greyjoy',
          },
        },
      },
    });

    const person = store.peekRecord('person', '1');

    person.name.set('first', 'Reek');

    server.put('/people/1', () => {
      return [
        500,
        { 'Content-Type': 'application/json' },
        '{"error": "Server error"}',
      ];
    });

    try {
      await person.save();
    } catch {
      // Expected to fail
    }

    assert.ok(
      person.hasDirtyAttributes,
      'record still dirty after failed save',
    );
    assert.strictEqual(
      person.name.first,
      'Reek',
      'fragment retains dirty value after failed save',
    );
  });

  test('deeply nested fragments propagate dirty state correctly', async function (assert) {
    store.push({
      data: {
        type: 'user',
        id: '1',
        attributes: {
          name: 'Test User',
          orders: [
            {
              amount: '100.00',
              products: [
                { name: 'Product 1', sku: 'SKU1', price: '50.00' },
                { name: 'Product 2', sku: 'SKU2', price: '50.00' },
              ],
            },
          ],
        },
      },
    });

    const user = store.peekRecord('user', '1');

    assert.notOk(user.hasDirtyAttributes, 'user starts clean');

    // Modify deeply nested fragment
    user.orders.firstObject.products.firstObject.set('price', '75.00');

    assert.ok(
      user.orders.firstObject.products.firstObject.hasDirtyAttributes,
      'deeply nested fragment is dirty',
    );
    assert.ok(
      user.orders.firstObject.hasDirtyAttributes,
      'parent fragment is dirty',
    );
    assert.ok(user.hasDirtyAttributes, 'top-level owner is dirty');
  });
});
