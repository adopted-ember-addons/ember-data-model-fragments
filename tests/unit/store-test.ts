import { module, test } from 'qunit';
import Store from '@ember-data/store';

import { setupTest } from '../helpers';

module('unit - `Store`', function (hooks) {
  setupTest(hooks);

  test('the store has an `isFragment` method', function (assert) {
    assert.ok(store.isFragment('name'), 'a fragment should return true');
    assert.notOk(store.isFragment('person', 'a model should return false'));
  });
});
