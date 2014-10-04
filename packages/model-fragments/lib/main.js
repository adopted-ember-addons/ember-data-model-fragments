import Ember from 'ember';
import ext from './fragments/ext';
import ModelFragment from './fragments/model';
import FragmentArray from './fragments/array/fragment';
import FragmentTransform from './fragments/transform';
import { hasOneFragment, hasManyFragments, fragmentOwner, fragmentType } from './fragments/attributes';
import initializers from './initializers';

/**
  Ember Data Model Fragments

  @module ember-data.model-fragments
  @main ember-data.model-fragments
*/

DS.ModelFragment = ModelFragment;
DS.FragmentArray = FragmentArray;
DS.FragmentTransform = FragmentTransform;
DS.hasOneFragment = hasOneFragment;
DS.hasManyFragments = hasManyFragments;
DS.fragmentOwner = fragmentOwner;
DS.fragmentType = fragmentType;

Ember.onLoad('Ember.Application', function(Application) {
  initializers.forEach(Application.initializer, Application);
});

if (Ember.libraries) {
  Ember.libraries.register('Model Fragments', '/* @echo version */');
}

// Something must be exported...
export default DS;
