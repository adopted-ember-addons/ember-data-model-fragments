import Namespace from '@ember/application/namespace';
import { importSync } from '@embroider/macros';
import Fragment from './fragment.js';
import FragmentArray from './array/fragment.js';
import FragmentTransform from './transforms/fragment.js';
import FragmentArrayTransform from './transforms/fragment-array.js';
import ArrayTransform from './transforms/array.js';
import fragment from './attributes/fragment.js';
import fragmentArray from './attributes/fragment-array.js';
import array from './attributes/array.js';
import fragmentOwner from './attributes/fragment-owner.js';
import FragmentStore from './store.js';
import FragmentSerializer from './serializers/fragment.js';
import FragmentRESTSerializer from './serializers/rest.js';
import FragmentJSONAPISerializer from './serializers/json-api.js';

var version = "9.0.0";

/**
  Ember Data Model Fragments

  @module ember-data-model-fragments
  @main ember-data-model-fragments
*/
const MF = Namespace.create({
  VERSION: version,
  Fragment: Fragment,
  FragmentArray: FragmentArray,
  FragmentTransform: FragmentTransform,
  FragmentArrayTransform: FragmentArrayTransform,
  ArrayTransform: ArrayTransform,
  FragmentStore: FragmentStore,
  FragmentSerializer: FragmentSerializer,
  FragmentRESTSerializer: FragmentRESTSerializer,
  FragmentJSONAPISerializer: FragmentJSONAPISerializer,
  fragment: fragment,
  fragmentArray: fragmentArray,
  array: array,
  fragmentOwner: fragmentOwner
});
Object.defineProperty(MF, 'FragmentSchemaService', {
  get() {
    return importSync('./schema-service.ts').default;
  }
});

export { MF as default };
//# sourceMappingURL=index.js.map
