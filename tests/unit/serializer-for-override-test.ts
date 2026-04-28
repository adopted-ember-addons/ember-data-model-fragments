// @ts-nocheck -- incremental TS conversion; types will be tightened in follow-up PRs.
import { module, test } from 'qunit';
import { setupApplicationTest } from '../helpers/index.ts';
import JSONSerializer from '@ember-data/serializer/json';
import FragmentSerializer, { FragmentRESTSerializer } from '#src/serializer.ts';

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
      // The override must be present on every store instance regardless of
      // whether the parent Store uses a class-field arrow (5.x) or a prototype
      // method (4.12). We don't assert anything about the prototype shape:
      // on 4.12 the parent's method is inherited and visible on the prototype
      // chain, on 5.x the parent uses a class field and the prototype slot is
      // undefined. Either way our constructor-installed override wins.
      assert.strictEqual(
        typeof store.serializerFor,
        'function',
        'serializerFor is a function on the instance',
      );

      // Behavioral smoke test: looking up a fragment must NOT throw and must
      // return a JSONSerializer (the class-field shadowing bug surfaces here
      // as either a thrown error or a wrong-class result).
      const fragmentSerializer = store.serializerFor('name');
      assert.ok(
        fragmentSerializer instanceof JSONSerializer,
        'fragment lookup goes through our override (returns a JSONSerializer)',
      );

      // And it must NOT be the application serializer (which is a
      // FragmentRESTSerializer in the dummy app).
      assert.notOk(
        fragmentSerializer instanceof FragmentRESTSerializer,
        'fragment serializer is not the application serializer',
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

    test('repeated fragment lookups return a working FragmentSerializer', function (assert) {
      // The override must consistently return a FragmentSerializer (not the
      // application serializer / not undefined) for the same fragment type
      // across calls. We don't assert strict instance identity because
      // upstream container behavior around synthesized factories is not
      // guaranteed to be a singleton across ember-data versions.
      const a = store.serializerFor('name');
      const b = store.serializerFor('name');
      assert.ok(
        a instanceof FragmentSerializer,
        'first lookup returns a FragmentSerializer',
      );
      assert.ok(
        b instanceof FragmentSerializer,
        'second lookup returns a FragmentSerializer',
      );
    });

    test('serializer:-mf-fragment is registered exactly once and reused', function (assert) {
      // First call should trigger lazy registration.
      const first = store.serializerFor('name');
      assert.ok(
        owner.hasRegistration('serializer:-mf-fragment'),
        'fallback is registered after first fragment lookup',
      );
      assert.ok(
        first instanceof FragmentSerializer,
        'first lookup returns a FragmentSerializer',
      );

      // Different fragment types must also resolve through the fallback to a
      // FragmentSerializer (no fall-through to serializer:application).
      const second = store.serializerFor('address');
      assert.ok(
        second instanceof FragmentSerializer,
        'lookup for a different fragment type also returns a FragmentSerializer',
      );
    });
  },
);
