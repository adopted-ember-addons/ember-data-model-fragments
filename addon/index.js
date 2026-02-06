import Namespace from '@ember/application/namespace';
import Ember from 'ember';
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
  FragmentSerializerMixin,
} from './serializer';
import FragmentSchemaService from './schema-service';

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
  FragmentSerializerMixin: FragmentSerializerMixin,
  FragmentSchemaService: FragmentSchemaService,
  fragment: fragment,
  fragmentArray: fragmentArray,
  array: array,
  fragmentOwner: fragmentOwner,
});

if (Ember.libraries) {
  Ember.libraries.register('Model Fragments', MF.VERSION);
}

export default MF;
