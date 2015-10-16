import Ember from 'ember';
import Fragment from './fragments/fragment';
import FragmentArray from './fragments/array/fragment';
import FragmentTransform from './fragments/transforms/fragment';
import FragmentArrayTransform from './fragments/transforms/fragment-array';
import ArrayTransform from './fragments/transforms/array';
import initializers from './initializers';
import {
  fragment,
  fragmentArray,
  array,
  fragmentOwner
} from './fragments/attributes';

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

Ember.onLoad('Ember.Application', function(Application) {
  initializers.forEach(Application.initializer, Application);
});

if (Ember.libraries) {
  Ember.libraries.register('Model Fragments', MF.VERSION);
}

Ember.lookup.MF = MF;

export default MF;
