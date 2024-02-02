import { schedule } from '@ember/runloop';
import { module, test } from 'qunit';
import { setupApplicationTest } from '../helpers';
import Name from 'dummy/models/name';
import JSONAPISerializer from '@ember-data/serializer/json-api';
import JSONSerializer from '@ember-data/serializer/json';
import { gte } from 'ember-compatibility-helpers';

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
    assert.throws(() => {
      store.createFragment('person');
    }, 'an error is thrown when given a bad type');
  });

  test('the store has an `isFragment` method', function (assert) {
    assert.ok(store.isFragment('name'), 'a fragment should return true');
    assert.notOk(store.isFragment('person', 'a model should return false'));
  });

  test('the default fragment serializer does not use the application serializer', function (assert) {
    class ApplicationSerializer extends JSONAPISerializer {}
    owner.register('serializer:application', ApplicationSerializer);

    assert.ok(
      !(store.serializerFor('name') instanceof ApplicationSerializer),
      'fragment serializer fallback is not `JSONAPISerializer`'
    );
    assert.ok(
      store.serializerFor('name') instanceof JSONSerializer,
      'fragment serializer fallback is correct'
    );
  });

  if (!gte('ember-data', '4.4.0')) {
    // default adapter was deprecated in ember-data 3.15 and removed in 4.4
    // https://deprecations.emberjs.com/ember-data/v3.x/#toc_ember-data-default-adapter
    // https://github.com/emberjs/data/pull/7861

    test("the default fragment serializer does not use the adapter's `defaultSerializer`", function (assert) {
      store.set('defaultAdapter.defaultSerializer', '-json-api');

      assert.ok(
        !(store.serializerFor('name') instanceof JSONAPISerializer),
        'fragment serializer fallback is not `JSONAPISerializer`'
      );
      assert.ok(
        store.serializerFor('name') instanceof JSONSerializer,
        'fragment serializer fallback is correct'
      );
    });
  }

  test('the default fragment serializer is `serializer:-fragment` if registered', function (assert) {
    class FragmentSerializer extends JSONSerializer {}
    owner.register('serializer:-fragment', FragmentSerializer);

    assert.ok(
      store.serializerFor('name') instanceof FragmentSerializer,
      'fragment serializer fallback is correct'
    );
  });

  test('the application serializer can be looked up', function (assert) {
    assert.ok(
      store.serializerFor('application') instanceof JSONSerializer,
      'application serializer can still be looked up'
    );
  });

  test('the default serializer can be looked up', function (assert) {
    assert.ok(
      store.serializerFor('-default') instanceof JSONSerializer,
      'default serializer can still be looked up'
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
