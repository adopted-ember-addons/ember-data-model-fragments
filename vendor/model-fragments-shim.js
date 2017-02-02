/* eslint-disable */

(function() {
  var importPaths = [
    '',
    'array/fragment',
    'array/stateful',
    'transforms/array',
    'transforms/fragment',
    'transforms/fragment-array',
    'utils/instance-of-type',
    'utils/map',
    'attributes',
    'ext',
    'fragment',
    'index',
    'states',
    'version',
  ];

  function shimModule(name) {
    if (name) { name = '/' + name; }
    define('model-fragments' + name, function() {
      Ember.deprecate('Importing from the `model-fragments` module is deprecated. ' +
        'Instead import from `ember-data-model-fragments`.', false, {
        id: 'model-fragments-module-import',
        until: '3.0.0'
      });
      return require('ember-data-model-fragments' + name);
    });
  }

  for (var i = 0; i < importPaths.length; i++) {
    shimModule(importPaths[i]);
  }
})();
