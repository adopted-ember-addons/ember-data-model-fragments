import Ember from 'ember';
import Transform from 'ember-data/system/transform';
import JSONAPISerializer from 'ember-data/serializers/json-api-serializer';

/**
  @module ember-data.model-fragments
*/

var get = Ember.get;

/**
  Transform for `DS.hasOneFragment` fragment attribute which delegates work to
  the fragment type's serializer

  @class FragmentTransform
  @namespace DS
  @extends DS.Transform
*/
var FragmentTransform = Transform.extend({
  store: null,
  modelName: null,
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

    var store = this.store;
    var serializer = store.serializerFor(snapshot.modelName);

    return serializer.serialize(snapshot);
  },

  modelNameFor: function modelNameFor(data) {
    var modelName = get(this, 'modelName');
    var polymorphicTypeProp = get(this, 'polymorphicTypeProp');

    if (data && polymorphicTypeProp && data[polymorphicTypeProp]) {
      modelName = data[polymorphicTypeProp];
    }

    return modelName;
  },

  deserializeSingle: function deserializeSingle(data) {
    var store = this.store;
    var modelName = this.modelNameFor(data);
    var serializer = store.serializerFor(modelName);

    Ember.assert("The `JSONAPISerializer` is not suitable for model fragments, please use `JSONSerializer`", !(serializer instanceof JSONAPISerializer));

    var isNewSerializerAPI = get(serializer, 'isNewSerializerAPI');
    var typeClass = store.modelFor(modelName);
    var serialized = serializer.normalize(typeClass, data);

    // The new serializer API returns a full JSON API document, but we only need
    // the attributes hash
    if (isNewSerializerAPI) {
      return get(serialized, 'data.attributes');
    } else {
      return serialized;
    }
  }
});

export default FragmentTransform;
