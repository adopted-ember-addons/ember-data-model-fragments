'use strict';

const EmberAddon = require('ember-cli/lib/broccoli/ember-addon');

module.exports = function (defaults) {
  const app = new EmberAddon(defaults, {
    // Add options here
  });

  /*
    This build file specifies the options for the dummy test app of this
    addon, located in `/tests/dummy`
    This build file does *not* influence how the addon or the app using it
    behave. You most likely want to be modifying `./index.js` or app's build file
  */

  // Configure warp-drive build settings for ember-data 5.7+
  // This keeps deprecated APIs available that we still rely on
  try {
    const { setConfig } = require('@warp-drive/build-config');
    setConfig(app, __dirname, {
      deprecations: {
        DEPRECATE_EARLY_STATIC: true,
      },
    });
  } catch {
    // @warp-drive/build-config not available (ember-data < 5.7)
  }

  const { maybeEmbroider } = require('@embroider/test-setup');
  return maybeEmbroider(app, {
    skipBabel: [
      {
        package: 'qunit',
      },
    ],
  });
};
