import ModelFragment from './fragments/model';
import FragmentTransform from './fragments/transform';
import { hasOneFragment, hasManyFragments, fragmentOwner } from './fragments/attributes';
import initializers from './initializers';

DS.ModelFragment = ModelFragment;
DS.FragmentTransform = FragmentTransform;
DS.hasOneFragment = hasOneFragment;
DS.hasManyFragments = hasManyFragments;
DS.fragmentOwner = fragmentOwner;

Ember.onLoad('Ember.Application', function(Application) {
  initializers.forEach(Application.initializer, Application);
});

Ember.libraries.register('Ember Data - Model Fragments', '0.1.0');

// Something must be exported...
export default DS;
