// Import the full module to ensure monkey-patches are applied before any store
// instances are created. Sad face for side-effects :(
import 'ember-data-model-fragments';
import FragmentTransform from 'ember-data-model-fragments/transforms/fragment';
import FragmentArrayTransform from 'ember-data-model-fragments/transforms/fragment-array';
import ArrayTransform from 'ember-data-model-fragments/transforms/array';

export default {
  name: 'fragmentTransform',
  before: 'ember-data',

  initialize(application) {
    application.register('transform:fragment', FragmentTransform);
    application.register('transform:fragment-array', FragmentArrayTransform);
    application.register('transform:array', ArrayTransform);
  }
};
