/* jshint node: true */
'use strict';

var merge = require('broccoli-merge-trees');
var version = require('./lib/version');

module.exports = {
  name: 'model-fragments',

  treeForAddon: function(tree) {
    var versioned = merge([ version(), tree ]);

    return this._super.treeForAddon.call(this, versioned);
  }
};
