module.exports = {
  options: {
    debugStatements: [
      "Ember.warn",
      "Ember.assert",
      "Ember.deprecate",
      "Ember.debug",
      "Ember.Logger.info"
    ]
  },
  stripDebug: {
    options: {
      enableStripDebug: true
    },
    src: 'dist/ember-data.model-fragments.js',
    dest: 'dist/ember-data.model-fragments.prod.js'
  },
};
