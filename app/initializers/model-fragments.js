import FragmentTransform from 'ember-data-model-fragments/transforms/fragment';
import FragmentArrayTransform from 'ember-data-model-fragments/transforms/fragment-array';
import ArrayTransform from 'ember-data-model-fragments/transforms/array';

export default {
  name: "fragmentTransform",
  before: "store",

  initialize: function(application) {
    application.register('transform:fragment', FragmentTransform);
    application.register('transform:fragment-array', FragmentArrayTransform);
    application.register('transform:array', ArrayTransform);
  }
};

