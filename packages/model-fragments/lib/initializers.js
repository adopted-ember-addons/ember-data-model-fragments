import FragmentTransform from './fragments/transforms/fragment';
import FragmentArrayTransform from './fragments/transforms/fragment-array';
import ArrayTransform from './fragments/transforms/array';

var initializers = [
  {
    name: "fragmentTransform",
    before: "store",

    initialize: function(container, application) {
      application.register('transform:fragment', FragmentTransform);
      application.register('transform:fragment-array', FragmentArrayTransform);
      application.register('transform:array', ArrayTransform);
    }
  }
];

export default initializers;
