import { assert } from '@ember/debug';
import { getOwner } from '@ember/application';
import { makeArray } from '@ember/array';
import { get, computed } from '@ember/object';
import Transform from 'ember-data/transform';
import { inject as service } from '@ember/service';

/**
  @module ember-data-model-fragments
*/

/**
  Transform for `MF.array` that transforms array data with the given transform
  type.

  @class ArrayTransform
  @namespace MF
  @extends DS.Transform
*/
const ArrayTransform = Transform.extend({
  store: service(),
  type: null,

  deserialize: function deserializeArray(data) {
    if (data == null) {
      return null;
    }

    let transform = get(this, 'transform');

    data = makeArray(data);

    if (!transform) {
      return data;
    }

    return data.map(transform.deserialize, transform);
  },

  serialize: function serializeArray(array) {
    if (array == null) {
      return null;
    }

    let transform = get(this, 'transform');

    array = array.toArray ? array.toArray() : array;

    if (!transform) {
      return array;
    }

    return array.map(transform.serialize, transform);
  },

  transform: computed('type', function() {
    let attributeType = this.get('type');

    if (!attributeType) {
      return null;
    }

    let transform = getOwner(this).lookup(`transform:${attributeType}`);
    assert(`Unable to find transform for '${attributeType}'`, !!transform);

    return transform;
  })
});

export default ArrayTransform;
