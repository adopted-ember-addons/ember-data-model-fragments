(function() {
  // Setup ember-dev test helpers
  var DeprecationAssert = require('ember-dev/test-helper/deprecation').default;
  var setupQUnit = require('ember-dev/test-helper/setup-qunit').default;

  var testHelpers = new DeprecationAssert({
    Ember: window.Ember,
    runningProdBuild: false
  });

  setupQUnit(testHelpers);

  // Require actual tests
  var moduleNames = Object.keys(requirejs.entries);

  moduleNames.forEach(function(moduleName) {
    if (moduleName.match(/[_-]test$/)) {
      require(moduleName);
    }
  });
})();