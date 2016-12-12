// Import the full module to ensure monkey-patchs are applied before any store
// instances are created. Sad face for side-effects :(
import 'model-fragments';
import FragmentTransform from 'model-fragments/transforms/fragment';
import FragmentArrayTransform from 'model-fragments/transforms/fragment-array';
import ArrayTransform from 'model-fragments/transforms/array';

export default {
  name: "fragmentTransform",
  before: "ember-data",

  initialize: function(application) {
    application.register('transform:fragment', FragmentTransform);
    application.register('transform:fragment-array', FragmentArrayTransform);
    application.register('transform:array', ArrayTransform);
  }
};
