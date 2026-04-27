import { module, test } from 'qunit';
import { setupApplicationTest } from '../helpers';
import JSONSerializer from '@ember-data/serializer/json';
import FragmentSerializer, {
  FragmentRESTSerializer,
} from 'ember-data-model-fragments/serializer';
import FragmentStore from 'ember-data-model-fragments/store';

/*
  Tests for the mechanics of FragmentStore's `serializerFor` override.

  History: in ember-data 5.x, Store defines `serializerFor` as a class-field
  arrow function. Class fields are assigned per-instance during the parent
  constructor and shadow any prototype-level method on subclasses. That meant
  a prototype-level override on FragmentStore was silently overwritten before
  it could ever run. We now install the override in FragmentStore's
  constructor (after super()) so it wins on both 5.x (parent class field) and
  4.x (parent prototype method), and we capture the parent serializerFor for
  use as the non-fragment fallback.

  These tests pin down that behavior so it cannot silently regress.
*/

module(
  'unit - FragmentStore serializerFor override mechanics',
  function (hooks) {
    setupApplicationTest(hooks);

    let store, owner;

    hooks.beforeEach(function () {
      owner = this.owner;
      store = owner.lookup('service:store');
    });

    hooks.afterEach(function () {
      store = null;
      owner = null;
    });

    test('serializerFor on the instance is installed by FragmentStore, not inherited', function (assert) {
      // The parent Store either defines serializerFor as a class field
      // (per-instance arrow function) or as a prototype method. Either way,
      // our constructor-installed override should be present on the instance
      // and must be a function (not `undefined`).
      assert.strictEqual(
        typeof store.serializerFor,
        'function',
        'serializerFor is a function on the instance',
      );

      // It must not be the FragmentStore prototype method (we install per
      // instance, so the prototype slot is undefined).
      assert.strictEqual(
        FragmentStore.prototype.serializerFor,
        undefined,
        'FragmentStore does not declare serializerFor on its prototype',
      );

      // Two independently-constructed FragmentStore instances should each
      // have their own serializerFor function (because we install in the
      // constructor). If somebody refactors away from the per-instance
      // install, this comparison will start being === and break.
      const otherStore = owner.factoryFor('service:store').create();
      try {
        assert.notStrictEqual(
          store.serializerFor,
          otherStore.serializerFor,
          'each FragmentStore instance gets its own serializerFor function',
        );
      } finally {
        otherStore.destroy();
      }

      // And as a behavioral smoke test: looking up a fragment must NOT throw
      // and must return a JSONSerializer (the class-field shadowing bug
      // surfaces here as undefined behavior or a wrong-class result).
      const fragmentSerializer = store.serializerFor('name');
      assert.ok(
        fragmentSerializer instanceof JSONSerializer,
        'fragment lookup goes through our override (returns a JSONSerializer)',
      );
    });

    test('non-fragment lookups defer to the parent serializerFor', function (assert) {
      // `person` is a regular Model, not a Fragment. It should resolve via the
      // parent's chain (which falls back to serializer:application for unknown
      // model serializers).
      const personSerializer = store.serializerFor('person');
      const appSerializer = store.serializerFor('application');

      assert.strictEqual(
        personSerializer,
        appSerializer,
        'non-fragment model falls back to serializer:application via parent',
      );
      assert.ok(
        personSerializer instanceof FragmentRESTSerializer,
        'parent fallback returns the registered application serializer',
      );
    });

    test('serializerFor does not throw for unknown model names', function (assert) {
      // _isFragmentSafe must catch modelFor errors so we never explode on
      // synthetic / unknown names that internal ember-data callers may pass.
      let result;
      assert.true(
        (() => {
          try {
            result = store.serializerFor('definitely-not-a-real-model');
            return true;
          } catch {
            return false;
          }
        })(),
        'serializerFor("unknown") does not throw',
      );
      // Whatever it returned, it should not have been routed through the
      // fragment branch (it should defer to the parent), and on this store
      // the parent falls back to serializer:application.
      assert.strictEqual(
        result,
        store.serializerFor('application'),
        'unknown model defers to parent (serializer:application fallback)',
      );
    });

    test('synthetic names never enter the fragment branch', function (assert) {
      // `application`, `-default`, and any leading-dash key are treated as
      // synthetic and must defer to the parent so app-level lookups behave
      // normally.
      const app = store.serializerFor('application');
      assert.ok(
        app instanceof FragmentRESTSerializer,
        'application resolves to the registered application serializer',
      );

      // -default may or may not exist depending on ed version; just make sure
      // we don't redirect it through the fragment chain (i.e. the result must
      // not be the lazily-registered FragmentSerializer fallback unless that
      // happens to be what the parent returns).
      const dashDefault = store.serializerFor('-default');
      assert.notStrictEqual(
        dashDefault,
        owner.lookup('serializer:-mf-fragment'),
        '-default is not redirected to the fragment fallback',
      );

      // A leading-dash key registered by a consumer must also defer to parent.
      owner.register('serializer:-custom', class extends JSONSerializer {});
      const dashCustom = store.serializerFor('-custom');
      assert.strictEqual(
        typeof dashCustom,
        'object',
        '-custom looks up via the parent chain',
      );
    });

    test('repeated fragment lookups return the same instance', function (assert) {
      // The container caches singletons, so repeated lookups should be ===.
      // This guards against accidentally creating a new FragmentSerializer per
      // call (which would also defeat any internal caching the serializer
      // itself might do).
      const a = store.serializerFor('name');
      const b = store.serializerFor('name');
      assert.strictEqual(a, b, 'same instance returned across calls');
      assert.ok(
        a instanceof FragmentSerializer,
        'returned serializer is a FragmentSerializer',
      );
    });

    test('serializer:-mf-fragment is registered exactly once and reused', function (assert) {
      // First call should trigger lazy registration.
      const first = store.serializerFor('name');
      assert.ok(
        owner.hasRegistration('serializer:-mf-fragment'),
        'fallback is registered after first fragment lookup',
      );

      // Lookups for different fragment types should reuse the same registration
      // (and the same singleton instance).
      const second = store.serializerFor('address');
      assert.strictEqual(
        first,
        second,
        'different fragment types share the same fallback instance',
      );
    });
  },
);
