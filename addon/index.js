import Ember from 'ember';
import Fragment from './fragment';
import FragmentArray from './array/fragment';
import FragmentTransform from './transforms/fragment';
import FragmentArrayTransform from './transforms/fragment-array';
import ArrayTransform from './transforms/array';
import {
  fragment,
  fragmentArray,
  array,
  fragmentOwner
} from './attributes';

/**
  Ember Data Model Fragments

  @module ember-data-model-fragments
  @main ember-data-model-fragments
*/
var MF = Ember.Namespace.create({
  VERSION: 'VERSION_STRING_PLACEHOLDER',
  Fragment: Fragment,
  FragmentArray: FragmentArray,
  FragmentTransform: FragmentTransform,
  FragmentArrayTransform: FragmentArrayTransform,
  ArrayTransform: ArrayTransform,
  fragment: fragment,
  fragmentArray: fragmentArray,
  array: array,
  fragmentOwner: fragmentOwner
});

if (Ember.libraries) {
  Ember.libraries.register('Model Fragments', MF.VERSION);
}

Ember.lookup.MF = MF;

export default MF;
