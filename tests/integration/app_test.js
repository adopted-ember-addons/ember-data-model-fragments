import { module, test } from 'qunit';
import { setupApplicationTest } from 'ember-qunit';

module('Integration | Application', function (hooks) {
  setupApplicationTest(hooks);

  test('the model fragments initializer causes no deprecations', function (assert) {
    assert.ok(
      this.owner.hasRegistration('transform:fragment'),
      'the model fragments initilizer ran'
    );
  });
});
