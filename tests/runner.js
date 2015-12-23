(function() {
  // Setup ember-dev test helpers
  var CompositeAssert = require('ember-dev/test-helper/index').default;
  var setupQUnit = require('ember-dev/test-helper/setup-qunit').default;
  var debugModule = Ember.__loader.require('ember-metal/debug');

  var env = new CompositeAssert({
    Ember: window.Ember,
    runningProdBuild: false,
    getDebugFunction: debugModule.getDebugFunction,
    setDebugFunction: debugModule.setDebugFunction,
  });

  setupQUnit(env);

  // Require actual tests
  var moduleNames = Object.keys(requirejs.entries);

  moduleNames.forEach(function(moduleName) {
    if (moduleName.match(/[_-]test$/)) {
      require(moduleName);
    }
  });
})();
