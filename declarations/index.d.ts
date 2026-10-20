import Namespace from '@ember/application/namespace';
import Fragment from './fragment.ts';
import FragmentArray from './array/fragment.ts';
import FragmentTransform from './transforms/fragment.ts';
import FragmentArrayTransform from './transforms/fragment-array.ts';
import ArrayTransform from './transforms/array.ts';
import { fragment, fragmentArray, array, fragmentOwner } from './attributes/index.ts';
import FragmentStore from './store.ts';
import FragmentSerializer, { FragmentRESTSerializer, FragmentJSONAPISerializer } from './serializer.ts';
import type FragmentSchemaService from './schema-service.ts';
/**
  Ember Data Model Fragments

  @module ember-data-model-fragments
  @main ember-data-model-fragments
*/
declare const MF: Namespace & {
    VERSION: string;
    Fragment: typeof Fragment;
    FragmentArray: typeof FragmentArray;
    FragmentTransform: typeof FragmentTransform;
    FragmentArrayTransform: typeof FragmentArrayTransform;
    ArrayTransform: typeof ArrayTransform;
    FragmentStore: typeof FragmentStore;
    FragmentSerializer: typeof FragmentSerializer;
    FragmentRESTSerializer: typeof FragmentRESTSerializer;
    FragmentJSONAPISerializer: typeof FragmentJSONAPISerializer;
    fragment: typeof fragment;
    fragmentArray: typeof fragmentArray;
    array: typeof array;
    fragmentOwner: typeof fragmentOwner;
    readonly FragmentSchemaService: typeof FragmentSchemaService;
};
export default MF;
//# sourceMappingURL=index.d.ts.map