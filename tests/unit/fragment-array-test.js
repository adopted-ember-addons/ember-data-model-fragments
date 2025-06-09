import { module, test } from 'qunit';
import { setupApplicationTest } from '../helpers';
let store;

module('unit - `MF.fragmentArray`', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function () {
    store = this.owner.lookup('service:store');
  });

  hooks.afterEach(function () {
    store = null;
  });

  test('fragment arrays can be copied', async function (assert) {
    const data = {
      names: [
        {
          first: 'Meryn',
          last: 'Trant',
        },
      ],
    };

    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: data,
      },
    });

    const person = await store.findRecord('person', 1);
    const copy = person.names.copy();

    assert.equal(copy.length, person.names.length, "copy's size is correct");
    assert.equal(
      copy[0].first,
      data.names[0].first,
      'child fragments are copied'
    );
    assert.ok(
      copy[0] !== person.names.firstObject,
      'copied fragments are new fragments'
    );
  });

  test('fragment arrays have an owner', async function (assert) {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          names: [
            {
              first: 'Tyrion',
              last: 'Lannister',
            },
          ],
        },
      },
    });

    const person = await store.findRecord('person', 1);
    assert.strictEqual(person.names.owner, person);
  });

  test('fragments can be created and added through the fragment array', async function (assert) {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          names: [
            {
              first: 'Tyrion',
              last: 'Lannister',
            },
          ],
        },
      },
    });

    const person = await store.findRecord('person', 1);
    const fragments = person.names;
    const length = fragments.length;

    const fragment = fragments.createFragment({
      first: 'Hugor',
      last: 'Hill',
    });

    assert.equal(fragments.length, length + 1, 'property size is correct');
    assert.equal(
      fragments.indexOf(fragment),
      length,
      'new fragment is in correct location'
    );
  });

  test('fragments can be added to the fragment array', async function (assert) {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          names: [
            {
              first: 'Tyrion',
              last: 'Lannister',
            },
          ],
        },
      },
    });

    const person = await store.findRecord('person', 1);
    const fragments = person.names;
    const length = fragments.length;

    const fragment = store.createFragment('name', {
      first: 'Yollo',
    });

    fragments.addFragment(fragment);

    assert.equal(fragments.length, length + 1, 'property size is correct');
    assert.equal(
      fragments.indexOf(fragment),
      length,
      'fragment is in correct location'
    );
  });

  test('objects can be added to the fragment array', async function (assert) {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          names: [
            {
              first: 'Tyrion',
              last: 'Lannister',
            },
          ],
        },
      },
    });

    const person = await store.findRecord('person', 1);
    const fragments = person.names;
    const length = fragments.length;
    fragments.addFragment({ first: 'Yollo', last: 'Baggins' });

    assert.equal(fragments.length, length + 1, 'property size is correct');
    assert.equal(fragments.objectAt(0).first, 'Tyrion');
    assert.equal(fragments.objectAt(0).last, 'Lannister');
    assert.equal(fragments.objectAt(1).first, 'Yollo');
    assert.equal(fragments.objectAt(1).last, 'Baggins');
  });

  test('fragments can be removed from the fragment array', async function (assert) {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          names: [
            {
              first: 'Arya',
              last: 'Stark',
            },
          ],
        },
      },
    });

    const person = await store.findRecord('person', 1);
    const fragments = person.names;
    const fragment = fragments.firstObject;
    const length = fragments.length;

    fragments.removeFragment(fragment);

    assert.equal(fragments.length, length - 1, 'property size is correct');
    assert.ok(!fragments.includes(fragment), 'fragment is removed');
  });

  test('changes to array contents change the fragment array `hasDirtyAttributes` property', async function (assert) {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          names: [
            {
              first: 'Aegon',
              last: 'Targaryen',
            },
            {
              first: 'Visenya',
              last: 'Targaryen',
            },
          ],
        },
      },
    });

    const person = await store.findRecord('person', 1);
    const fragments = person.names;
    const fragment = fragments.firstObject;
    const newFragment = store.createFragment('name', {
      first: 'Rhaenys',
      last: 'Targaryen',
    });

    assert.ok(
      !fragments.hasDirtyAttributes,
      'fragment array is initially in a clean state'
    );

    fragments.removeFragment(fragment);

    assert.ok(
      fragments.hasDirtyAttributes,
      'fragment array is in dirty state after removal'
    );

    fragments.unshiftObject(fragment);

    assert.ok(
      !fragments.hasDirtyAttributes,
      'fragment array is returned to clean state'
    );

    fragments.addFragment(newFragment);

    assert.ok(
      fragments.hasDirtyAttributes,
      'fragment array is in dirty state after addition'
    );

    fragments.removeFragment(newFragment);

    assert.ok(
      !fragments.hasDirtyAttributes,
      'fragment array is returned to clean state'
    );

    fragments.removeFragment(fragment);
    fragments.addFragment(fragment);

    assert.ok(
      fragments.hasDirtyAttributes,
      'fragment array is in dirty state after reordering'
    );

    fragments.removeFragment(fragment);
    fragments.unshiftObject(fragment);

    assert.ok(
      !fragments.hasDirtyAttributes,
      'fragment array is returned to clean state'
    );
  });

  test('changes to array contents change the fragment array `hasDirtyAttributes` property', async function (assert) {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          names: [
            {
              first: 'Jon',
              last: 'Snow',
            },
          ],
        },
      },
    });

    const person = await store.findRecord('person', 1);
    const fragments = person.names;
    const fragment = fragments.firstObject;

    assert.ok(
      !fragments.hasDirtyAttributes,
      'fragment array is initially in a clean state'
    );

    fragment.set('last', 'Stark');

    assert.ok(
      fragments.hasDirtyAttributes,
      'fragment array in dirty state after change to a fragment'
    );

    fragment.set('last', 'Snow');

    assert.ok(
      !fragments.hasDirtyAttributes,
      'fragment array is returned to clean state'
    );
  });

  test('changes to array contents and fragments can be rolled back', async function (assert) {
    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          names: [
            {
              first: 'Catelyn',
              last: 'Tully',
            },
            {
              first: 'Catelyn',
              last: 'Stark',
            },
          ],
        },
      },
    });

    const person = await store.findRecord('person', 1);
    const fragments = person.names;
    const fragment = fragments.firstObject;

    const originalState = fragments.toArray();

    fragment.set('first', 'Cat');
    fragments.removeFragment(fragments.lastObject);
    fragments.createFragment({
      first: 'Lady',
      last: 'Stonehart',
    });

    fragments.rollbackAttributes();

    assert.ok(!fragments.hasDirtyAttributes, 'fragment array is not dirty');
    assert.ok(
      !fragments.isAny('hasDirtyAttributes'),
      'all fragments are in clean state'
    );
    assert.deepEqual(
      fragments.toArray(),
      originalState,
      'original array contents is restored'
    );
  });

  test('can be created with null', function (assert) {
    const person = store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          names: null,
        },
      },
    });

    assert.strictEqual(person.names, null);
  });

  test('can be updated to null', function (assert) {
    const person = store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          names: [
            {
              first: 'Catelyn',
              last: 'Tully',
            },
            {
              first: 'Catelyn',
              last: 'Stark',
            },
          ],
        },
      },
    });

    assert.deepEqual(
      person.names.toArray().map((f) => f.serialize()),
      [
        {
          first: 'Catelyn',
          last: 'Tully',
          prefixes: [],
        },
        {
          first: 'Catelyn',
          last: 'Stark',
          prefixes: [],
        },
      ]
    );

    store.push({
      data: {
        type: 'person',
        id: 1,
        attributes: {
          names: null,
        },
      },
    });

    assert.strictEqual(person.names, null);
  });
});
