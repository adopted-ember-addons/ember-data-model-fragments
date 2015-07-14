import Ember from 'ember';
import FragmentTransform from './fragment';

/**
  @module ember-data.model-fragments
*/

var map = Ember.EnumerableUtils.map;

/**
  Transform for `DS.hasManyFragments` fragment attribute which delegates work to
  the fragment type's serializer

  @class FragmentArrayTransform
  @namespace DS
  @extends DS.Transform
*/
var FragmentArrayTransform = FragmentTransform.extend({
  deserialize: function deserializeFragmentArray(data) {
    if (data == null) {
      return null;
    }

    return map(data, function(datum) {
      return this.deserializeSingle(datum);
    }, this);
  },

  serialize: function serializeFragmentArray(snapshots) {
    if (!snapshots) {
      return null;
    }

    var store = this.store;

    return map(snapshots, function(snapshot) {
      var serializer = store.serializerFor(snapshot.modelName);

      return serializer.serialize(snapshot);
    });
  }
});

export default FragmentArrayTransform;