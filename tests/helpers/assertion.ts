import { getDebugFunction, setDebugFunction } from '@ember/debug';
import { DEBUG } from '@glimmer/env';

declare global {
  interface Assert {
    /**
     * Asserts that `Ember.assert` is called with a falsy condition
     * @param func function which calls `Ember.assert`
     * @param expectedMessage the expected assertion text to compare with the first argument to `Ember.assert`
     */
    expectAssertion(func: () => void, expectedMessage: string): void;
  }
}

/**
 * Asserts that `Ember.assert` is called with a falsy condition
 * @param func function which calls `Ember.assert`
 * @param expectedMessage the expected assertion text to compare with the first argument to `Ember.assert`
 */
function expectAssertion(
  this: Assert,
  func: () => void,
  expectedMessage: string,
) {
  if (!DEBUG) {
    this.ok(true, 'Assertions disabled in production builds');
    return;
  }
  const originalAssertFunc = getDebugFunction('assert');
  try {
    let called = false;
    let failed = false;
    let actualMessage;
    // `Ember.assert`'s type is an assertion signature (`asserts condition`),
    // which a plain function expression can never be assignable to, so the
    // spy is cast to the shape we just captured.
    const spy = function assert(desc: string, test?: unknown) {
      called = true;
      if (!test) {
        failed = true;
        actualMessage = desc;
      }
    } as unknown as typeof originalAssertFunc;
    setDebugFunction('assert', spy);
    func();
    this.true(called, `Expected Ember.assert to be called`);
    this.true(failed, `Expected Ember.assert to fail its test`);
    this.strictEqual(
      actualMessage,
      expectedMessage,
      'Expected Ember.assert message to match',
    );
  } finally {
    // restore original assert function
    setDebugFunction('assert', originalAssertFunc);
  }
}

export function setup(assert: Assert) {
  assert.expectAssertion = expectAssertion;
}
