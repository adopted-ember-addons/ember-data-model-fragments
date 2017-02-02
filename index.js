/* eslint-env node */
'use strict';

var merge = require('broccoli-merge-trees');
var version = require('./lib/version');

module.exports = {
  name: 'ember-data-model-fragments',

  init: function() {
    this._super.init && this._super.init.apply(this, arguments);

    var bowerDeps = this.project.bowerDependencies();

    if (bowerDeps['ember-data-model-fragments']) {
      var message = 'Please remove `ember-data-model-fragments` from `bower.json`, it is no longer used as of v2.3.0';

      if (this.ui.writeWarnLine) {
        this.ui.writeWarnLine(message);
      } else {
        this.ui.writeLine(message);
      }
    }
  },

  included: function() {
    this._super.included.apply(this, arguments);

    this.import('vendor/model-fragments-shim.js');
  },

  treeForAddon: function(tree) {
    var versioned = merge([ version(), tree ]);

    return this._super.treeForAddon.call(this, versioned);
  }
};
