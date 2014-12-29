var path = require('path');

module.exports = {
  description: 'Generates an ember-data.model-fragments model.',

  anonymousOptions: [
    'name',
    'attr:type'
  ],

  fileMapTokens: function() {
    return {
      __name__: function(options) {
        // In pod format, name the model 'fragment' to differentiate
        if (options.pod) {
          return 'fragment';
        }
        return options.dasherizedModuleName;
      },
      __path__: function(options) {
        if (options.pod) {
          return path.join(options.podPath, options.dasherizedModuleName);
        }
        // In non-pod format, fragments go in the 'models' directory
        return 'models';
      }
    };
  },

  locals: function(options) {
    return this.lookupBlueprint('model').locals(options);
  }
};
