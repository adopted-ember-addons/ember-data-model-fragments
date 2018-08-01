const path = require('path');

module.exports = {
  description: 'Generates an ember-data-model-fragments model.',

  anonymousOptions: [
    'name',
    'attr:type'
  ],

  fileMapTokens() {
    return {
      __name__(options) {
        // The name defaults to the blueprint name, which is 'fragment', but
        // it needs to be named 'model' for the resolver to find it
        if (options.pod) {
          return 'model';
        }
        return options.dasherizedModuleName;
      },
      __path__(options) {
        if (options.pod) {
          return path.join(options.podPath, options.dasherizedModuleName);
        }
        // In non-pod format, fragments go in the 'models' directory
        return 'models';
      }
    };
  },

  locals(options) {
    return this.lookupBlueprint('model').locals(options);
  }
};
