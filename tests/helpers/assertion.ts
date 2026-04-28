import { getDebugFunction, setDebugFunction } from '@ember/debug';
import { DEBUG } from '@glimmer/env';

declare global {
  interface Assert {
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
): void {
  if (!DEBUG) {
    this.ok(true, 'Assertions disabled in production builds');
    return;
  }
  const originalAssertFunc = getDebugFunction('assert');
  try {
    let called = false;
    let failed = false;
    let actualMessage: string | undefined;
    const stub = ((desc: string, test?: unknown) => {
      called = true;
      if (!test) {
        failed = true;
        actualMessage = desc;
      }
    }) as typeof originalAssertFunc;
    setDebugFunction('assert', stub);
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

export function setup(assert: Assert): void {
  assert.expectAssertion = expectAssertion;
}
