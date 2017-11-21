// Import the full module to ensure monkey-patches are applied before any store
// instances are created. Sad face for side-effects :(
import 'ember-data-model-fragments';
import 'ember-data-model-fragments/ext';

export default {
  name: 'fragmentTransform',
  after: 'ember-data',

  initialize() {}
};
