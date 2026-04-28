import Namespace from '@ember/application/namespace';
import { importSync } from '@embroider/macros';
import VERSION from './version.ts';
import Fragment from './fragment.ts';
import FragmentArray from './array/fragment.ts';
import FragmentTransform from './transforms/fragment.ts';
import FragmentArrayTransform from './transforms/fragment-array.ts';
import ArrayTransform from './transforms/array.ts';
import {
  fragment,
  fragmentArray,
  array,
  fragmentOwner,
} from './attributes/index.ts';
import FragmentStore from './store.ts';
import FragmentSerializer, {
  FragmentRESTSerializer,
  FragmentJSONAPISerializer,
} from './serializer.ts';

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
} as object);

Object.defineProperty(MF, 'FragmentSchemaService', {
  get() {
    return (importSync('./schema-service.ts') as { default: unknown }).default;
  },
});

export default MF;
