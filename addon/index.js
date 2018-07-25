import Ember from 'ember';
import VERSION from './version';
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
const MF = Ember.Namespace.create({ // eslint-disable-line ember/new-module-imports
  VERSION: VERSION,
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

export default MF;
