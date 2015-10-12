/* jshint unused: false */
import Ember from 'ember';
import DS from 'ember-data';
import { Store, Model } from './fragments/ext';
import Fragment from './fragments/model';
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

// Export classes to DS namespace for backwards compatibility
DS.ModelFragment = Fragment;
DS.FragmentArray = FragmentArray;
DS.FragmentTransform = FragmentTransform;
DS.FragmentArrayTransform = FragmentArrayTransform;
DS.ArrayTransform = ArrayTransform;

/**
  `DS.hasOneFragment` has been deprecated in favor of `MF.fragment`.

  @namespace DS
  @method hasOneFragment
  @deprecated
*/
DS.hasOneFragment = function hasOneFragmentDeprecation(modelName, options) {
  Ember.deprecate("The `DS.hasOneFragment` property has been deprecated in favor of `MF.fragment`");

  return fragment(modelName, options);
};

/**
  `DS.hasManyFragments` has been deprecated in favor of `MF.fragmentArray`.

  @namespace DS
  @method hasManyFragments
  @deprecated
*/
DS.hasManyFragments = function hasManyFragmentsDeprecation(modelName, options) {
  // If a modelName is not given, it implies an array of primitives
  if (Ember.typeOf(modelName) !== 'string') {
    Ember.deprecate("The `DS.hasManyFragments` property without a model name has been deprecated in favor of `MF.array`");

    return array(null, options);
  }

  Ember.deprecate("The `DS.hasManyFragments` property has been deprecated in favor of `MF.fragmentArray`");

  return fragmentArray(modelName, options);
};

/**
  `DS.fragmentOwner` has been deprecated in favor of `MF.fragmentOwner`.

  @namespace DS
  @method fragmentOwner
  @deprecated
*/
DS.fragmentOwner = function fragmentOwnerDeprecation() {
  Ember.deprecate("The `DS.fragmentOwner` property has been deprecated in favor of `MF.fragmentOwner`");

  return fragmentOwner();
};

/**
  Ember Data Model Fragments

  @module ember-data.model-fragments
  @main ember-data.model-fragments
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
