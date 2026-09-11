import { assert } from '@ember/debug';
import { getOwner } from '@ember/application';
import { makeArray } from '@ember/array';
import { computed } from '@ember/object';
import Transform from '@ember-data/serializer/transform';
import { service } from '@ember/service';

/**
  @module ember-data-model-fragments
*/

/**
  The public shape of `ArrayTransform`. The runtime class is built with
  `Transform.extend()` (see below), so the type surface is declared here for
  consumers — the inferred `.extend()` type cannot be emitted in declarations.
*/
// eslint-disable-next-line @typescript-eslint/no-unused-vars

/**
  Transform for `MF.array` that transforms array data with the given transform
  type.

  @class ArrayTransform
  @namespace MF
  @extends DS.Transform
*/
// eslint-disable-next-line ember/no-classic-classes
const ArrayTransform = Transform.extend({
  store: service('store'),
  type: null,
  deserialize: function deserializeArray(data) {
    if (data == null) {
      return null;
    }
    const transform = this.transform;
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
    const transform = this.transform;
    array = array.toArray ? array.toArray() : array;
    if (!transform) {
      return array;
    }
    return array.map(transform.serialize, transform);
  },
  transform: computed('type', function () {
    const attributeType = this.type;
    if (!attributeType) {
      return null;
    }
    const transform = getOwner(this).lookup(`transform:${attributeType}`);
    assert(`Unable to find transform for '${attributeType}'`, !!transform);
    return transform;
  })
});

export { ArrayTransform as default };
//# sourceMappingURL=array.js.map
