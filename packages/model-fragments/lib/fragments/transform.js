import Transform from '../transform';

/**
  @module ember-data.model-fragments
*/

/**
  Transform for all fragment attributes which delegates work to
  fragment serializers.

  @class FragmentTransform
  @namespace DS
  @extends DS.Transform
*/
var FragmentTransform = Transform.extend({
  deserialize: function(data) {
    // TODO: figure out how to get a handle to the fragment type here
    // without having to patch `DS.JSONSerializer#applyTransforms`
    return data;
  },

  serialize: function(fragment) {
    return fragment ? fragment.serialize() : null;
  }
});

export default FragmentTransform;
