import FragmentTransform from '../transforms/fragment';
import FragmentArrayTransform from '../transforms/fragment-array';
import ArrayTransform from '../transforms/array';

// Import model extensions to apply them
import '../ext/model';

export function initialize(application) {
  // Register the fragment transforms
  application.register('transform:fragment', FragmentTransform);
  application.register('transform:fragment-array', FragmentArrayTransform);
  application.register('transform:array', ArrayTransform);
}

export default {
  name: 'ember-data-model-fragments',
  initialize,
};
