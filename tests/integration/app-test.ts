import { module, skip, test } from 'qunit';
import Store from '@ember-data/store';

import { withLegacy } from '#src/utilities/with-legacy.ts';
import { withFragmentDefaults } from '#src/utilities/with-fragment-defaults.ts';
import { withFragmentArrayDefaults } from '#src/utilities/with-fragment-array-defaults.ts';
import { withArrayDefaults } from '#src/utilities/with-array-defaults.ts';

// @ts-expect-error TODO: not yet typed
import { setupApplicationTest } from '../helpers';

let store: Store;

module('Integration | Application', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function () {
    this.owner.register('service:store', Store);
    store = this.owner.lookup('service:store') as Store;
  });

  test('Fragment and FragmentArray are setup correctly', function (assert) {
    const PersonSchema = withLegacy({
      type: 'person',
      fields: [
        withFragmentDefaults('name'),
        withFragmentArrayDefaults('addresses'),
        withArrayDefaults('titles'),
      ],
    });

    const NameSchema = {
      type: 'fragment:name',
      identity: null,
      fields: [
        { kind: 'field', name: 'first' },
        { kind: 'field', name: 'last' },
      ],
      objectExtensions: ['ember-object', 'fragment'],
    };

    const AddressSchema = {
      type: 'fragment:address',
      identity: null,
      fields: [
        { kind: 'field', name: 'street' },
        { kind: 'field', name: 'city' },
        { kind: 'field', name: 'region' },
        { kind: 'field', name: 'country' },
      ],
    };

    // @ts-expect-error TODO: fix this
    store.schema.registerResources([PersonSchema, NameSchema, AddressSchema]);

    assert.ok(
      store.schema.hasResource(PersonSchema),
      'PersonSchema is registered',
    );
    assert.ok(store.schema.hasResource(NameSchema), 'NameSchema is registered');
    assert.ok(
      store.schema.hasResource(AddressSchema),
      'AddressSchema is registered',
    );
  });

  skip('the fragment and fragment-array extenions are registered', function () {
    // TODO: test that the initializer registers the correct things
  });
});
