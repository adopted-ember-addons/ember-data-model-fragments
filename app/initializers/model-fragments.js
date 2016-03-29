// Import the fragment base class to ensure monkey-patching side effects are
// applied before any store instances are created :(
import _ from 'model-fragments/fragment';
import FragmentTransform from 'model-fragments/transforms/fragment';
import FragmentArrayTransform from 'model-fragments/transforms/fragment-array';
import ArrayTransform from 'model-fragments/transforms/array';

export default {
  name: "fragmentTransform",
  before: "store",

  initialize: function(application) {
    application.register('transform:fragment', FragmentTransform);
    application.register('transform:fragment-array', FragmentArrayTransform);
    application.register('transform:array', ArrayTransform);
  }
};
