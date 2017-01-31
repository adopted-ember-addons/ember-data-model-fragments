import { test } from 'qunit';
import moduleForAcceptance from '../helpers/module-for-acceptance';

moduleForAcceptance('Integration | Application');

test('the model fragments initializer causes no deprecations', function(assert) {
  assert.expectNoDeprecation();

  assert.ok(this.application.hasRegistration('transform:fragment'), 'the model fragments initilizer ran');
});
