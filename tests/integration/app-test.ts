import { module, test } from 'qunit';
import { setupApplicationTest } from '../helpers/index.ts';
import type { TestContext } from '../helpers/index.ts';
import { getDeprecations } from '@ember/test-helpers';

module('Integration | Application', function (hooks) {
  setupApplicationTest(hooks);

  test('the model fragments initializer causes no deprecations', function (this: TestContext, assert: Assert) {
    assert.ok(
      this.owner.hasRegistration('transform:fragment'),
      'the model fragments initilizer ran',
    );
    assert.deepEqual(getDeprecations(), [], 'expected no deprecations');
  });
});
