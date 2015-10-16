'use strict';

module.exports = {
  normalizeEntityName: function() {
    // This might prevent an error that maybe still exists in ember-cli 1.5.0
  },

  afterInstall: function() {
    // By installing the package with Bower instead of including the artifact
    // straight out of the `node_modules/` directory, the app author can change
    // the actual version used in `bower.json`
    var json = require('../../../package.json');
    return this.addBowerPackageToProject('ember-data-model-fragments', json.version);
  }
};