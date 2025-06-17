'use strict';

const { dependencySatisfies } = require('@embroider/macros');

module.exports = {
  name: require('./package').name,

  // Ensure our initializer runs after ember-data
  init() {
    this._super.init && this._super.init.apply(this, arguments);

    // Make sure ember-data is available
    if (!this.project.findAddonByName('ember-data')) {
      throw new Error(
        'ember-data-model-fragments requires ember-data to be installed',
      );
    }
  },

  // Validate peer dependencies
  included(app) {
    this._super.included.apply(this, arguments);

    // Validate ember-data version
    this._validateEmberDataVersion();
  },

  _validateEmberDataVersion() {
    const emberDataAddon = this.project.findAddonByName('ember-data');

    if (!emberDataAddon) {
      throw new Error(
        'ember-data-model-fragments requires ember-data to be installed',
      );
    }

    // Check if we have the minimum required version (4.13.0-alpha.9+)
    if (!dependencySatisfies('ember-data', '>=4.13.0-alpha.9')) {
      const emberDataVersion = emberDataAddon.pkg.version;
      throw new Error(
        `ember-data-model-fragments v7+ requires ember-data >= 4.13.0-alpha.9. ` +
          `Found ember-data v${emberDataVersion}. ` +
          `Please upgrade ember-data or use ember-data-model-fragments v6.x for older ember-data versions.`,
      );
    }

    // Log successful validation in development
    if (this.app.env === 'development') {
      const emberDataVersion = emberDataAddon.pkg.version;
      console.log(
        `✓ ember-data-model-fragments v7 compatible with ember-data v${emberDataVersion}`,
      );
    }
  },
};
