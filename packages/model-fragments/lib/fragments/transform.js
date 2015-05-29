import Snapshot from '../snapshot';
import Transform from '../transform';

/**
  @module ember-data.model-fragments
*/

var get = Ember.get;
var isArray = Ember.isArray;
var map = Ember.EnumerableUtils.map;

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

  serialize: function(snapshot) {
    if (!snapshot) {
      return null;
    } else if (isArray(snapshot)) {
      return map(snapshot, serializeSnapshot);
    } else {
      return serializeSnapshot(snapshot);
    }
  }
});

function serializeSnapshot(snapshot) {
  // The snapshot can be a primitive value (which could be an object)
  if (!(snapshot instanceof Snapshot)) {
    return snapshot;
  }

  var modelName = snapshot.modelName || snapshot.typeKey;

  return get(snapshot, 'record.store').serializerFor(modelName).serialize(snapshot);
}

export default FragmentTransform;
