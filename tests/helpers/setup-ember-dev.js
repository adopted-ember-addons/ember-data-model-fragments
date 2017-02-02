// Copied, with slight modifications from ember-data.
//   https://github.com/emberjs/data/blob/master/tests/helpers/setup-ember-dev.js
/* globals QUnit */
import Ember from 'ember';
import EmberTestHelpers from 'ember-dev/test-helper/index';
let debugModule = Ember.__loader.require('ember-metal/debug');

const AVAILABLE_ASSERTIONS = ['expectAssertion', 'expectDeprecation', 'expectNoDeprecation', 'expectWarning', 'expectNoWarning'];

let originalModule = QUnit.module;

/**
 * We patch QUnit.module here so we can setup and teardown the helpers from
 * ember-dev before every test.
 *
 * Creating the helpers within QUnit.testStart and checking for the assertions
 * in QUnit.testDone doesn't work, as failed assertions in QUnit.testDone won't
 * make the corresponding test fail.
 */
QUnit.module = function(name, options = {}) {
  let testHelpers = new EmberTestHelpers({
    Ember,
    getDebugFunction: debugModule.getDebugFunction,
    setDebugFunction: debugModule.setDebugFunction
  });

  let originalBeforeEach = options.beforeEach || function() { };
  let originalAfterEach = options.afterEach || function() { };

  options.beforeEach = function(assert) {
    testHelpers.reset();
    testHelpers.inject();

    AVAILABLE_ASSERTIONS.forEach((name) => assert[name] = window[name]);

    originalBeforeEach.apply(this, arguments);
  };

  options.afterEach = function(assert) {
    originalAfterEach.apply(this, arguments);

    testHelpers.assert();
    testHelpers.restore();

    AVAILABLE_ASSERTIONS.forEach((name) => assert[name] = null);
  };

  return originalModule(name, options);
};
