import FragmentTransform from './fragment';

/**
  @module ember-data-model-fragments
*/

/**
  Transform for `MF.fragmentArray` fragment attribute which delegates work to
  the fragment type's serializer

  @class FragmentArrayTransform
  @namespace MF
  @extends DS.Transform
*/
const FragmentArrayTransform = FragmentTransform.extend({
  deserialize: function deserializeFragmentArray(data, options, parentData) {
    if (data == null) {
      return null;
    }

    return data.map(datum => {
      return this.deserializeSingle(datum, options, parentData);
    }, this);
  },

  serialize: function serializeFragmentArray(snapshots) {
    if (!snapshots) {
      return null;
    }

    let store = this.store;

    return snapshots.map(snapshot => {
      const realSnapshot = snapshot._createSnapshot ? snapshot._createSnapshot() : snapshot;
      let serializer = store.serializerFor(realSnapshot.modelName || realSnapshot.constructor.modelName);
      return serializer.serialize(realSnapshot);
    });
  }
});

export default FragmentArrayTransform;
