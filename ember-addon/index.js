'use strict';

module.exports = {
  name: 'ember-data-model-fragments',

  included: function(app) {
    this._super.included(app);

    app.import({
      development: app.bowerDirectory + '/ember-data-model-fragments/dist/ember-data-model-fragments.js',
      production: app.bowerDirectory + '/ember-data-model-fragments/dist/ember-data-model-fragments.prod.js'
    });

    app.import('vendor/ember-data-model-fragments/shim.js', {
      exports: {
        'model-fragments': [
          'default'
        ]
      }
    });
  }
};
