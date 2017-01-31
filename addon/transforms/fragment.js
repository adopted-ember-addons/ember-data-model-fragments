import Ember from 'ember';
import Transform from 'ember-data/transform';
import JSONAPISerializer from 'ember-data/serializers/json-api';

/**
  @module ember-data-model-fragments
*/

const get = Ember.get;

/**
  Transform for `MF.fragment` fragment attribute which delegates work to
  the fragment type's serializer

  @class FragmentTransform
  @namespace MF
  @extends DS.Transform
*/
const FragmentTransform = Transform.extend({
  store: null,
  type: null,
  polymorphicTypeProp: null,

  deserialize: function deserializeFragment(data) {
    if (data == null) {
      return null;
    }

    return this.deserializeSingle(data);
  },

  serialize: function serializeFragment(snapshot) {
    if (!snapshot) {
      return null;
    }

    let store = this.store;
    let serializer = store.serializerFor(snapshot.modelName);

    return serializer.serialize(snapshot);
  },

  modelNameFor(data) {
    let modelName = get(this, 'type');
    let polymorphicTypeProp = get(this, 'polymorphicTypeProp');

    if (data && polymorphicTypeProp && data[polymorphicTypeProp]) {
      modelName = data[polymorphicTypeProp];
    }

    return modelName;
  },

  deserializeSingle(data) {
    let store = this.store;
    let modelName = this.modelNameFor(data);
    let serializer = store.serializerFor(modelName);

    Ember.assert('The `JSONAPISerializer` is not suitable for model fragments, please use `JSONSerializer`', !(serializer instanceof JSONAPISerializer));

    let typeClass = store.modelFor(modelName);
    let serialized = serializer.normalize(typeClass, data);

    // `JSONSerializer#normalize` returns a full JSON API document, but we only
    // need the attributes hash
    return get(serialized, 'data.attributes');
  }
});

export default FragmentTransform;
