import Namespace from '@ember/application/namespace';
import { importSync } from '@embroider/macros';
import VERSION from './version';
import Fragment from './fragment';
import FragmentArray from './array/fragment';
import FragmentTransform from './transforms/fragment';
import FragmentArrayTransform from './transforms/fragment-array';
import ArrayTransform from './transforms/array';
import { fragment, fragmentArray, array, fragmentOwner } from './attributes';
import FragmentStore from './store';
import FragmentSerializer, {
  FragmentRESTSerializer,
  FragmentJSONAPISerializer,
} from './serializer';

/**
  Ember Data Model Fragments

  @module ember-data-model-fragments
  @main ember-data-model-fragments
*/
const MF = Namespace.create({
  VERSION: VERSION,
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
  fragmentOwner: fragmentOwner,
});

Object.defineProperty(MF, 'FragmentSchemaService', {
  get() {
    return importSync('./schema-service').default;
  },
});

export default MF;
