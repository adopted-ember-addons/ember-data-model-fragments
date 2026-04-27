import { module, test } from 'qunit';
import { setupApplicationTest } from '../helpers';
import { FragmentJSONAPISerializer } from 'ember-data-model-fragments/serializer';
import FragmentSerializer from 'ember-data-model-fragments/serializer';
import JSONAPISerializer from '@ember-data/serializer/json-api';
import Name from 'dummy/models/name';

/*
  Regression test for: "JSON:API application-serializer fallback for fragments".

  The dummy app's default `serializer:application` is FragmentRESTSerializer.
  This module forces `serializer:application` to FragmentJSONAPISerializer
  BEFORE any serializer lookup happens, then verifies:

    1. Fragment models do NOT resolve to the JSON:API application serializer
       (this was the regression: previously fragment models would fall back
       to `serializer:application`, and the FragmentTransform pipeline asserts
       the resolved serializer is not a JSONAPISerializer).
    2. A pushPayload of a JSON:API document with fragment / nested fragment /
       fragmentArray / @array attributes deserializes correctly end-to-end.
*/

module(
  'unit - FragmentJSONAPISerializer as application serializer',
  function (hooks) {
    setupApplicationTest(hooks);

    hooks.beforeEach(function () {
      // IMPORTANT: override BEFORE any serializer lookup happens so the
      // serializer cache cannot hold a reference to the previous (REST) one.
      this.owner.unregister('serializer:application');
      this.owner.register(
        'serializer:application',
        class ApplicationSerializer extends FragmentJSONAPISerializer {},
      );
    });

    test('fragment models do not resolve to a JSON:API application serializer', function (assert) {
      const store = this.owner.lookup('service:store');

      const appSerializer = store.serializerFor('application');
      assert.ok(
        appSerializer instanceof FragmentJSONAPISerializer,
        'sanity: application serializer is FragmentJSONAPISerializer',
      );

      const nameSerializer = store.serializerFor('name');
      assert.notStrictEqual(
        nameSerializer,
        appSerializer,
        'fragment serializer is NOT the JSON:API application serializer',
      );
      assert.notOk(
        nameSerializer instanceof JSONAPISerializer,
        'fragment serializer is not a JSONAPISerializer',
      );
      assert.ok(
        nameSerializer instanceof FragmentSerializer,
        'fragment serializer is a FragmentSerializer (JSON-based)',
      );
    });

    test('fragments deserialize via pushPayload when application serializer is FragmentJSONAPISerializer', function (assert) {
      const store = this.owner.lookup('service:store');

      store.pushPayload('person', {
        data: {
          type: 'people',
          id: '1',
          attributes: {
            title: 'Lord',
            name: {
              first: 'Eddard',
              last: 'Stark',
              prefixes: [{ name: 'Lord' }],
            },
            addresses: [
              { street: '1 Castle Black', city: 'Winterfell' },
              { street: '2 Kingsroad', city: 'Kings Landing' },
            ],
            strings: ['one', 'two', 'three'],
          },
        },
      });

      const person = store.peekRecord('person', 1);
      assert.ok(person, 'person was pushed');
      assert.ok(person.name instanceof Name, 'fragment is a Name fragment');
      assert.strictEqual(person.name.first, 'Eddard', 'fragment attr');
      assert.strictEqual(person.name.last, 'Stark', 'fragment attr');
      assert.strictEqual(person.addresses.length, 2, 'fragmentArray length');
      assert.strictEqual(
        person.addresses.objectAt(0).city,
        'Winterfell',
        'fragmentArray entry',
      );
      assert.strictEqual(
        person.name.prefixes.length,
        1,
        'nested fragmentArray length',
      );
      assert.strictEqual(
        person.name.prefixes.objectAt(0).name,
        'Lord',
        'nested fragmentArray entry',
      );
      assert.strictEqual(person.strings.length, 3, '@array("string") length');
      assert.strictEqual(
        person.strings.objectAt(0),
        'one',
        '@array("string") entry',
      );
    });

    test('a per-fragment-type serializer is honored end-to-end during pushPayload', function (assert) {
      // Custom serializer for the `name` fragment that maps `given`/`family`
      // wire keys to `first`/`last` model attrs. If our override resolves
      // `serializer:name` correctly, the fragment will deserialize using
      // these attrs; otherwise it would either fall back to the JSON:API
      // application serializer (broken) or the default FragmentSerializer
      // (which would not apply the attrs map).
      this.owner.register(
        'serializer:name',
        class CustomNameSerializer extends FragmentSerializer {
          attrs = {
            first: 'given',
            last: 'family',
          };
        },
      );

      const store = this.owner.lookup('service:store');

      store.pushPayload('person', {
        data: {
          type: 'people',
          id: '2',
          attributes: {
            name: { given: 'Arya', family: 'Stark' },
          },
        },
      });

      const person = store.peekRecord('person', 2);
      assert.strictEqual(
        person.name.first,
        'Arya',
        'per-fragment serializer attrs map applied (first <- given)',
      );
      assert.strictEqual(
        person.name.last,
        'Stark',
        'per-fragment serializer attrs map applied (last <- family)',
      );
    });

    test('a serializer:-fragment registration is honored end-to-end during pushPayload', function (assert) {
      // Global fragment serializer override. Same idea as the per-type test
      // but registered as the global fragment fallback.
      this.owner.register(
        'serializer:-fragment',
        class GlobalFragmentSerializer extends FragmentSerializer {
          attrs = {
            first: 'given',
            last: 'family',
          };
        },
      );

      const store = this.owner.lookup('service:store');

      store.pushPayload('person', {
        data: {
          type: 'people',
          id: '3',
          attributes: {
            name: { given: 'Sansa', family: 'Stark' },
          },
        },
      });

      const person = store.peekRecord('person', 3);
      assert.strictEqual(
        person.name.first,
        'Sansa',
        'global fragment serializer attrs applied (first <- given)',
      );
      assert.strictEqual(
        person.name.last,
        'Stark',
        'global fragment serializer attrs applied (last <- family)',
      );
    });
  },
);
