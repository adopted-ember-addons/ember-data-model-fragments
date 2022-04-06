import { assert } from '@ember/debug';
import { get } from '@ember/object';
import Transform from '@ember-data/serializer/transform';
import JSONAPISerializer from '@ember-data/serializer/json-api';
import { inject as service } from '@ember/service';

/**
  @module ember-data-model-fragments
*/

/**
  Transform for `MF.fragment` fragment attribute which delegates work to
  the fragment type's serializer

  @class FragmentTransform
  @namespace MF
  @extends DS.Transform
*/
const FragmentTransform = Transform.extend({
  store: service(),
  type: null,
  polymorphicTypeProp: null,

  deserialize: function deserializeFragment(data, options, parentData) {
    if (data == null) {
      return null;
    }

    return this.deserializeSingle(data, options, parentData);
  },

  serialize: function serializeFragment(snapshot) {
    if (!snapshot) {
      return null;
    }

    let store = this.store;
    const realSnapshot = snapshot._createSnapshot ? snapshot._createSnapshot() : snapshot;
    let serializer = store.serializerFor(realSnapshot.modelName || realSnapshot.constructor.modelName);

    return serializer.serialize(realSnapshot);
  },

  modelNameFor(data, options, parentData) {
    let modelName = this.type;
    let polymorphicTypeProp = this.polymorphicTypeProp;

    if (data && polymorphicTypeProp && data[polymorphicTypeProp]) {
      modelName = data[polymorphicTypeProp];
    } else if (options && typeof options.typeKey === 'function') {
      modelName = options.typeKey(data, parentData);
    }

    return modelName;
  },

  deserializeSingle(data, options, parentData) {
    let store = this.store;
    let modelName = this.modelNameFor(data, options, parentData);
    let serializer = store.serializerFor(modelName);

    assert('The `JSONAPISerializer` is not suitable for model fragments, please use `JSONSerializer`', !(serializer instanceof JSONAPISerializer));

    let typeClass = store.modelFor(modelName);
    let serialized = serializer.normalize(typeClass, data);

    // `JSONSerializer#normalize` returns a full JSON API document, but we only
    // need the attributes hash
    return get(serialized, 'data.attributes');
  }
});

export default FragmentTransform;
