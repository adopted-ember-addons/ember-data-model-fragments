import { module, test } from 'qunit';
import { setupApplicationTest } from '../helpers';
import { getDeprecations } from '@ember/test-helpers';

module('Integration | Application', function (hooks) {
  setupApplicationTest(hooks);

  test('the model fragments initializer causes no deprecations', function (assert) {
    assert.ok(
      (
        this.owner as unknown as { hasRegistration(name: string): boolean }
      ).hasRegistration('transform:fragment'),
      'the model fragments initializer ran',
    );
    assert.deepEqual(getDeprecations(), [], 'expected no deprecations');
  });
});
