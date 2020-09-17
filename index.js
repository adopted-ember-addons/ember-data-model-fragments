'use strict';

const merge = require('broccoli-merge-trees');
const version = require('./lib/version');
const calculateCacheKeyForTree = require('calculate-cache-key-for-tree');

module.exports = {
  name: 'ember-data-model-fragments',

  init() {
    this._super.init && this._super.init.apply(this, arguments);

    let bowerDeps = this.project.bowerDependencies();

    if (bowerDeps['ember-data-model-fragments']) {
      let message = 'Please remove `ember-data-model-fragments` from `bower.json`, it is no longer used as of v2.3.0';

      if (this.ui.writeWarnLine) {
        this.ui.writeWarnLine(message);
      } else {
        this.ui.writeLine(message);
      }
    }
  },

  included() {
    this._super.included.apply(this, arguments);
  },

  treeForAddon(tree) {
    let versioned = merge([version(), tree]);

    return this._super.treeForAddon.call(this, versioned);
  },

  cacheKeyForTree(treeType) {
    return calculateCacheKeyForTree(treeType, this);
  }
};
