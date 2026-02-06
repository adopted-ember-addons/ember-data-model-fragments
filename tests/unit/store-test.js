import { schedule } from '@ember/runloop';
import { module, test } from 'qunit';
import { setupApplicationTest } from '../helpers';
import Name from 'dummy/models/name';
import JSONSerializer from '@ember-data/serializer/json';

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

  test('attempting to create a fragment type that does not inherit from `MF.Fragment` throws an error', function (assert) {
    assert.expectAssertion(() => {
      store.createFragment('person');
    }, "The 'person' model must be a subclass of MF.Fragment");
  });

  test('the store has an `isFragment` method', function (assert) {
    assert.ok(store.isFragment('name'), 'a fragment should return true');
    assert.notOk(store.isFragment('person', 'a model should return false'));
  });

  test('fragments use the application serializer as fallback', function (assert) {
    // The dummy app's application serializer is FragmentRESTSerializer
    // Fragments without specific serializers should use the application serializer
    const fragmentSerializer = store.serializerFor('name');
    const applicationSerializer = store.serializerFor('application');

    assert.strictEqual(
      fragmentSerializer,
      applicationSerializer,
      'fragment serializer falls back to application serializer',
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
