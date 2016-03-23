/*jshint node:true*/
/* global require, module */
var EmberAddon = require('ember-cli/lib/broccoli/ember-addon');
var fs         = require('fs');
var replace    = require('broccoli-replace')

module.exports = function(defaults) {
  var app = new EmberAddon(defaults, {
    // Add options here
  });

  /*
    This build file specifies the options for the dummy test app of this
    addon, located in `/tests/dummy`
    This build file does *not* influence how the addon or the app using it
    behave. You most likely want to be modifying `./index.js` or app's build file
  */

  var compiled = app.toTree();
  compiled = versionStamp(compiled);
  return compiled;
};

function versionStamp(tree) {
  // The version in package.json can be changed, so this can't be `required()`
  // directly, and the git repo version is similarly unreliable
  var version = JSON.parse(fs.readFileSync('./package.json')).version;

  return replace(tree, {
    files: ['**/*'],
    patterns: [{
      match: /VERSION_STRING_PLACEHOLDER/g,
      replacement: version
    }]
  });
}
