import { schedule } from '@ember/runloop';
import { module, test } from 'qunit';
import { setupApplicationTest } from '../helpers';
import Name from '../../demo-app/models/name.js';
import JSONSerializer from '@ember-data/serializer/json';
import Person from '../../demo-app/models/person.js';
import { fragmentArray } from '#src/attributes/index.js';

let store, owner;

module('unit - `DS.Store`', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function () {
    owner = this.owner;
    store = owner.lookup('service:store');
  });

  hooks.afterEach(function () {
    store = null;
    owner = null;
  });

  test('a fragment can be created that starts in a dirty state', function (assert) {
    const address = store.createFragment('name');

    assert.ok(address instanceof Name, 'fragment is correct type');
    assert.ok(address.hasDirtyAttributes, 'fragment starts in dirty state');
  });

  test('createFragment applies provided values even when defaults exist', function (assert) {
    class PersonWithDefaultName extends Person {
      @fragmentArray('name', {
        defaultValue: [{ first: 'Default', last: 'Name' }],
      })
      names;
    }

    owner.register('model:person-with-default-name', PersonWithDefaultName);

    const person = store.createRecord('person-with-default-name');
    const name = store.createFragment('name', {
      first: 'Arya',
      last: 'Stark',
    });
    const arrayFragment = person.names.createFragment({
      first: 'Sansa',
      last: 'Stark',
    });

    assert.strictEqual(name.first, 'Arya', 'explicit fragment props win');
    assert.strictEqual(
      name.last,
      'Stark',
      'explicit fragment props are applied',
    );
    assert.strictEqual(
      arrayFragment.first,
      'Sansa',
      'fragment array createFragment applies explicit props',
    );
    assert.strictEqual(
      arrayFragment.last,
      'Stark',
      'fragment array createFragment applies all explicit props',
    );
  });

  test('attempting to create a fragment type that does not inherit from `MF.Fragment` throws an error', function (assert) {
    assert.expectAssertion(() => {
      store.createFragment('person');
    }, "The 'person' model must be a subclass of MF.Fragment");
  });

  test('the store has an `isFragment` method', function (assert) {
    assert.ok(store.isFragment('name'), 'a fragment should return true');
    assert.notOk(store.isFragment('person', 'a model should return false'));
  });

  test('fragments do NOT fall back to the application serializer', function (assert) {
    // Regression: previously the addon overrode `serializerFor` so fragment
    // models never resolved to `serializer:application`. That override was
    // dropped in the 4.13/5.x compatibility work, which made fragment
    // deserialization on ember-data 4.12 break when the app's application
    // serializer was JSON:API (the FragmentTransform pipeline asserts that
    // the resolved fragment serializer is not a `JSONAPISerializer`).
    //
    // Fragment serializers should always resolve to a `JSONSerializer`-based
    // serializer (FragmentSerializer by default), not `serializer:application`.
    const fragmentSerializer = store.serializerFor('name');
    const applicationSerializer = store.serializerFor('application');

    assert.notStrictEqual(
      fragmentSerializer,
      applicationSerializer,
      'fragment serializer is not the application serializer',
    );
    assert.ok(
      fragmentSerializer instanceof JSONSerializer,
      'fragment serializer is a JSONSerializer (not REST or JSON:API)',
    );
  });

  test('a per-fragment serializer registration wins over the default fallback', function (assert) {
    class CustomNameSerializer extends JSONSerializer {}
    owner.register('serializer:name', CustomNameSerializer);

    assert.ok(
      store.serializerFor('name') instanceof CustomNameSerializer,
      'app-provided serializer:name is used',
    );
  });

  test('a serializer:-fragment registration overrides the default fragment fallback for all fragments', function (assert) {
    class GlobalFragmentSerializer extends JSONSerializer {}
    owner.register('serializer:-fragment', GlobalFragmentSerializer);

    assert.ok(
      store.serializerFor('name') instanceof GlobalFragmentSerializer,
      'serializer:-fragment is used as the global fragment fallback',
    );
  });

  test('the application serializer can be looked up', function (assert) {
    assert.ok(
      store.serializerFor('application') instanceof JSONSerializer,
      'application serializer can still be looked up',
    );
  });

  test('the default serializer can be looked up', function (assert) {
    assert.ok(
      store.serializerFor('-default') instanceof JSONSerializer,
      'default serializer can still be looked up',
    );
  });

  test('pushPayload deserializes fragments end-to-end with the default REST application serializer', function (assert) {
    // Sanity: with the default dummy app setup (FragmentRESTSerializer as
    // application serializer, no per-fragment overrides), pushing a record
    // with fragments should round-trip through the fragment transform
    // pipeline using the bundled FragmentSerializer.
    store.pushPayload('person', {
      person: {
        id: '42',
        title: 'Lord',
        name: { first: 'Eddard', last: 'Stark' },
        addresses: [{ street: '1 Castle Black', city: 'Winterfell' }],
      },
    });

    const person = store.peekRecord('person', 42);
    assert.ok(person, 'person was pushed');
    assert.ok(person.name instanceof Name, 'fragment is a Name');
    assert.strictEqual(person.name.first, 'Eddard', 'fragment attr');
    assert.strictEqual(person.addresses.length, 1, 'fragmentArray length');
    assert.strictEqual(
      person.addresses.objectAt(0).city,
      'Winterfell',
      'fragmentArray entry',
    );
  });

  test('unloadAll destroys fragments', function (assert) {
    const person = store.createRecord('person', {
      name: {
        first: 'Catelyn',
        last: 'Stark',
      },
    });
    const name = person.name;

    store.unloadAll();

    schedule('destroy', () => {
      assert.ok(person.isDestroying, 'the model is being destroyed');
      assert.ok(name.isDestroying, 'the fragment is being destroyed');
    });
  });
});
