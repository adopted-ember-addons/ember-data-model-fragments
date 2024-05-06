import { getDebugFunction, setDebugFunction } from '@ember/debug';
import { DEBUG } from '@glimmer/env';

/**
 * Asserts that `Ember.assert` is called with a falsy condition
 * @param func function which calls `Ember.assert`
 * @param expectedMessage the expected assertion text to compare with the first argument to `Ember.assert`
 */
function expectAssertion(func, expectedMessage) {
  if (!DEBUG) {
    this.ok(true, 'Assertions disabled in production builds');
    return;
  }
  const originalAssertFunc = getDebugFunction('assert');
  try {
    let called = false;
    let failed = false;
    let actualMessage;
    setDebugFunction('assert', function assert(desc, test) {
      called = true;
      if (!test) {
        failed = true;
        actualMessage = desc;
      }
    });
    func();
    this.true(called, `Expected Ember.assert to be called`);
    this.true(failed, `Expected Ember.assert to fail its test`);
    this.strictEqual(
      actualMessage,
      expectedMessage,
      'Expected Ember.assert message to match'
    );
  } finally {
    // restore original assert function
    setDebugFunction('assert', originalAssertFunc);
  }
}

export function setup(assert) {
  assert.expectAssertion = expectAssertion;
}
