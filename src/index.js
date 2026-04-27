import Namespace from '@ember/application/namespace';
import { importSync } from '@embroider/macros';
import VERSION from './version.js';
import Fragment from './fragment.js';
import FragmentArray from './array/fragment.js';
import FragmentTransform from './transforms/fragment.js';
import FragmentArrayTransform from './transforms/fragment-array.js';
import ArrayTransform from './transforms/array.js';
import {
  fragment,
  fragmentArray,
  array,
  fragmentOwner,
} from './attributes/index.js';
import FragmentStore from './store.js';
import FragmentSerializer, {
  FragmentRESTSerializer,
  FragmentJSONAPISerializer,
} from './serializer.js';

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
    return importSync('./schema-service.js').default;
  },
});

export default MF;
