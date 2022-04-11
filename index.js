'use strict';

const merge = require('broccoli-merge-trees');
const version = require('./lib/version');
const calculateCacheKeyForTree = require('calculate-cache-key-for-tree');

module.exports = {
  name: require('./package').name,

  treeForAddon(tree) {
    let versioned = merge([version(), tree]);

    return this._super.treeForAddon.call(this, versioned);
  },

  cacheKeyForTree(treeType) {
    return calculateCacheKeyForTree(treeType, this);
  }
};
