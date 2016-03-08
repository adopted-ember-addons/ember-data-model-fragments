import Ember from 'ember';
import Transform from 'ember-data/system/transform';
import map from '../../util/map';
import getOwner from '../../util/ember-getowner-polyfill-polyfill';

/**
  @module ember-data-model-fragments
*/

var get = Ember.get;
var makeArray = Ember.makeArray;
var computed = Ember.computed;

/**
  Transform for `MF.array` that transforms array data with the given transform
  type.

  @class ArrayTransform
  @namespace MF
  @extends DS.Transform
*/
var ArrayTransform = Transform.extend({
  store: null,
  type: null,

  deserialize: function deserializeArray(data) {
    if (data == null) {
      return null;
    }

    var transform = get(this, 'transform');

    data = makeArray(data);

    if (!transform) {
      return data;
    }

    return map(data, transform.deserialize, transform);
  },

  serialize: function serializeArray(array) {
    if (array == null) {
      return null;
    }

    var transform = get(this, 'transform');

    array = array.toArray ? array.toArray() : array;

    if (!transform) {
      return array;
    }

    return map(array, transform.serialize, transform);
  },

  transform: computed('type', function() {
    var attributeType = this.get('type');

    if (!attributeType) {
      return null;
    }
    var appInstance = getOwner(get(this, 'store'));
    var transform = appInstance.lookup('transform:' + attributeType);
    Ember.assert("Unable to find transform for '" + attributeType + "'", !!transform);

    return transform;
  })
});

export default ArrayTransform;
