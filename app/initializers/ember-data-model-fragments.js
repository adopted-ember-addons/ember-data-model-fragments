// Import the addon initializer and Model extensions to ensure they're applied
import { initialize } from 'ember-data-model-fragments/initializers/fragment-transforms';
// Import Model extensions to ensure monkey-patches are applied
import 'ember-data-model-fragments/ext/model';

export default {
  name: 'ember-data-model-fragments',

  initialize(application) {
    // Explicitly initialize fragment transforms
    initialize(application);
  },
};
