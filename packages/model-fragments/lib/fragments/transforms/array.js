import Ember from 'ember';
import Transform from 'ember-data/system/transform';

/**
  @module ember-data.model-fragments
*/

var makeArray = Ember.makeArray;

/**
  Transform for array-like attributes fragment attribute with no model

  @class ArrayTransform
  @namespace DS
  @extends DS.Transform
*/
var ArrayTransform = Transform.extend({
  deserialize: function deserializeArray(data) {
    return Ember.makeArray(data);
  },

  serialize: function serializeArray(array) {
    return array && array.toArray ? array.toArray() : array;
  }
});

export default ArrayTransform;