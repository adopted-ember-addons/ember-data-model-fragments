import FragmentTransform from './fragment';
import { recordIdentifierFor } from '@ember-data/store';

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

    return data.map((datum) => {
      return this.deserializeSingle(datum, options, parentData);
    }, this);
  },

  serialize: function serializeFragmentArray(snapshots) {
    if (!snapshots) {
      return null;
    }

    const store = this.store;

    return snapshots.map((snapshot) => {
      // In ember-data 4.12+, fragment attributes in Snapshot._attributes may be:
      // 1. A Fragment instance (has _createSnapshot method)
      // 2. A Snapshot (has eachAttribute method) - from ext.js patch
      // 3. Raw data object (plain Object) - when cache returns raw data

      if (typeof snapshot._createSnapshot === 'function') {
        // It's a Fragment instance - create snapshot and serialize
        const realSnapshot = snapshot._createSnapshot();
        const identifier = recordIdentifierFor(snapshot);
        const modelName = identifier.type;
        const serializer = store.serializerFor(modelName);
        return serializer.serialize(realSnapshot);
      }

      if (typeof snapshot.eachAttribute === 'function') {
        // It's already a Snapshot - serialize directly
        const modelName =
          snapshot.modelName || snapshot.identifier?.type || this.type;
        const serializer = store.serializerFor(modelName);
        return serializer.serialize(snapshot);
      }

      // It's raw data (plain object) - return as-is
      // This happens in ember-data 4.12+ where fragment data is stored as plain objects
      return snapshot;
    });
  },
});

export default FragmentArrayTransform;
