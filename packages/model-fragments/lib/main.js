import ModelFragment from './fragments/model';
import FragmentArray from './fragments/array/fragment';
import FragmentTransform from './fragments/transform';
import { hasOneFragment, hasManyFragments, fragmentOwner } from './fragments/attributes';
import initializers from './initializers';

DS.ModelFragment = ModelFragment;
DS.FragmentArray = FragmentArray;
DS.FragmentTransform = FragmentTransform;
DS.hasOneFragment = hasOneFragment;
DS.hasManyFragments = hasManyFragments;
DS.fragmentOwner = fragmentOwner;

Ember.onLoad('Ember.Application', function(Application) {
  initializers.forEach(Application.initializer, Application);
});

// Something must be exported...
export default DS;
