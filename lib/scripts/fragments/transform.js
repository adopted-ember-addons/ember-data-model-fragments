import Transform from '../transform';

//
// Fragment Transform
//

// Delegate to the specific serializer for the fragment
var FragmentTransform = Transform.extend({
  deserialize: function(data) {
    // TODO: figure out how to get a handle to the fragment here
    // without having to patch `DS.JSONSerializer#applyTransforms`
    return data;
  },

  serialize: function(fragment) {
    return fragment ? fragment.serialize() : null;
  }
});

export default FragmentTransform;
