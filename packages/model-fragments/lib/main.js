import Ember from 'ember';
import DS from 'ember-data';
import { Store, Model } from './fragments/ext';
import ModelFragment from './fragments/model';
import FragmentArray from './fragments/array/fragment';
import FragmentTransform from './fragments/transforms/fragment';
import FragmentArrayTransform from './fragments/transforms/fragment-array';
import ArrayTransform from './fragments/transforms/array';
import { hasOneFragment, hasManyFragments, fragmentOwner } from './fragments/attributes';
import initializers from './initializers';

function exportMethods(scope) {
  scope.ModelFragment = ModelFragment;
  scope.FragmentArray = FragmentArray;
  scope.FragmentTransform = FragmentTransform;
  scope.FragmentArrayTransform = FragmentArrayTransform;
  scope.ArrayTransform = ArrayTransform;
  scope.hasOneFragment = hasOneFragment;
  scope.hasManyFragments = hasManyFragments;
  scope.fragmentOwner = fragmentOwner;
}

/**
  Ember Data Model Fragments

  @module ember-data.model-fragments
  @main ember-data.model-fragments
*/
var MF = Ember.Namespace.create({
  VERSION: 'VERSION_STRING_PLACEHOLDER'
});

exportMethods(MF);

// This will be removed at some point in favor of the `MF` namespace
exportMethods(DS);

Ember.onLoad('Ember.Application', function(Application) {
  initializers.forEach(Application.initializer, Application);
});

if (Ember.libraries) {
  Ember.libraries.register('Model Fragments', MF.VERSION);
}

export default MF;
