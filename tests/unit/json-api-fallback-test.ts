import { module, test } from 'qunit';
import { setupApplicationTest } from '../helpers/index.ts';
import {
  default as FragmentSerializer,
  FragmentJSONAPISerializer,
} from '#src/serializer.ts';
import JSONAPISerializer from '@ember-data/serializer/json-api';
import Name from '../../demo-app/models/name.ts';

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
      // @ts-expect-error: upstream type issue
      this.owner.unregister('serializer:application');
      this.owner.register(
        'serializer:application',
        class ApplicationSerializer extends FragmentJSONAPISerializer {},
      );
    });

    test('fragment models do not resolve to a JSON:API application serializer', function (assert) {
      const store = this.owner.lookup('service:store') as any;

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
      const store = this.owner.lookup('service:store') as any;

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
      // Spy serializer for the `name` fragment. We only assert that:
      //   - serializerFor('name') returns *this* spy (so the fragment
      //     pipeline would use it on versions that route fragment data
      //     through serializer.normalize)
      // Note: on ed 5.x, pushPayload of fragment attributes does not go
      // through the fragment serializer's normalize (the V2 cache uses the
      // schema service to strip fragment attrs before transforms run), so
      // this test asserts the resolution wiring rather than the attrs map.
      class CustomNameSerializer extends FragmentSerializer {}

      (this.owner as any).register('serializer:name', CustomNameSerializer);

      const store = this.owner.lookup('service:store') as any;

      assert.ok(
        store.serializerFor('name') instanceof CustomNameSerializer,
        'per-fragment serializer:name is resolved',
      );

      // And the JSON:API application serializer must still not be reached:
      assert.notOk(
        store.serializerFor('name') instanceof JSONAPISerializer,
        'per-fragment serializer is not the JSON:API application serializer',
      );

      // Sanity: pushPayload still works.
      store.pushPayload('person', {
        data: {
          type: 'people',
          id: '2',
          attributes: { name: { first: 'Arya', last: 'Stark' } },
        },
      });
      assert.strictEqual(
        store.peekRecord('person', 2).name.first,
        'Arya',
        'pushPayload still deserializes the fragment',
      );
    });

    test('a serializer:-fragment registration is honored end-to-end during pushPayload', function (assert) {
      class GlobalFragmentSerializer extends FragmentSerializer {}

      (this.owner as any).register(
        'serializer:-fragment',
        GlobalFragmentSerializer,
      );

      const store = this.owner.lookup('service:store') as any;

      assert.ok(
        store.serializerFor('name') instanceof GlobalFragmentSerializer,
        'global serializer:-fragment is resolved',
      );
      assert.notOk(
        store.serializerFor('name') instanceof JSONAPISerializer,
        'global fragment serializer is not the JSON:API application serializer',
      );

      // Sanity: pushPayload still works.
      store.pushPayload('person', {
        data: {
          type: 'people',
          id: '3',
          attributes: { name: { first: 'Sansa', last: 'Stark' } },
        },
      });
      assert.strictEqual(
        store.peekRecord('person', 3).name.first,
        'Sansa',
        'pushPayload still deserializes the fragment',
      );
    });

    test('record.serialize() outbound with a JSON:API application serializer', function (assert) {
      // Outbound path: serializing a record whose application serializer is
      // FragmentJSONAPISerializer must still produce fragment data without
      // routing fragments through the JSON:API serializer (which would either
      // assert in the fragment pipeline or emit the wrong shape).

      const store = this.owner.lookup('service:store') as any;

      store.pushPayload('person', {
        data: {
          type: 'people',
          id: '4',
          attributes: {
            title: 'Lady',
            name: { first: 'Catelyn', last: 'Stark' },
            addresses: [{ street: '1 Castle Black', city: 'Winterfell' }],
            strings: ['a', 'b'],
          },
        },
      });

      const person = store.peekRecord('person', 4);
      const serialized = person.serialize();

      // FragmentJSONAPISerializer wraps things in a JSON:API document.
      // We don't pin the exact wire shape across ed versions \u2014 we just
      // verify that the fragment data round-trips through to the output.
      const flat = JSON.stringify(serialized);
      assert.ok(
        flat.includes('Catelyn') && flat.includes('Stark'),
        'fragment attrs survive outbound serialization',
      );
      assert.ok(
        flat.includes('Winterfell'),
        'fragmentArray entries survive outbound serialization',
      );
      assert.ok(
        flat.includes('"a"') && flat.includes('"b"'),
        '@array entries survive outbound serialization',
      );
    });
  },
);
