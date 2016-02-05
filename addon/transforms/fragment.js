import Ember from 'ember';
import Transform from 'ember-data/transform';
import JSONAPISerializer from 'ember-data/serializers/json-api';

/**
  @module ember-data-model-fragments
*/

var get = Ember.get;

/**
  Transform for `MF.fragment` fragment attribute which delegates work to
  the fragment type's serializer

  @class FragmentTransform
  @namespace MF
  @extends DS.Transform
*/
var FragmentTransform = Transform.extend({
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

    var store = this.store;
    var serializer = store.serializerFor(snapshot.modelName);

    return serializer.serialize(snapshot);
  },

  modelNameFor: function modelNameFor(data) {
    var modelName = get(this, 'type');
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

    var typeClass = store.modelFor(modelName);
    var serialized = serializer.normalize(typeClass, data);

    // `JSONSerializer#normalize` returns a full JSON API document, but we only
    // need the attributes hash
    return get(serialized, 'data.attributes');
  }
});

export default FragmentTransform;
