import { assert } from '@ember/debug';
import { getOwner } from '@ember/application';
import { makeArray } from '@ember/array';
// The `computed` import is used inside the classic `.extend()` literal below,
// not in a native class body.
// eslint-disable-next-line ember/no-computed-properties-in-native-classes
import { computed } from '@ember/object';
import Transform from '@ember-data/serializer/transform';
import { service } from '@ember/service';
import type Store from '@ember-data/store';

/**
  @module ember-data-model-fragments
*/

/**
  The public shape of `ArrayTransform`. The runtime class is built with
  `Transform.extend()` (see below), so the type surface is declared here for
  consumers — the inferred `.extend()` type cannot be emitted in declarations.
*/
// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare class ArrayTransformClass extends Transform {
  store: Store;
  type: string | null;
  readonly transform: unknown;
  deserialize(data: any, options?: any, parentData?: any): any;
  serialize(array: any, options?: any): any;
}

/**
  Transform for `MF.array` that transforms array data with the given transform
  type.

  @class ArrayTransform
  @namespace MF
  @extends DS.Transform
*/
// eslint-disable-next-line ember/no-classic-classes
const ArrayTransform = Transform.extend({
  store: service('store') as unknown as Store,
  type: null as string | null,

  deserialize: function deserializeArray(this: any, data: any) {
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

  serialize: function serializeArray(this: any, array: any) {
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

  transform: computed('type', function (this: any) {
    const attributeType = this.type;

    if (!attributeType) {
      return null;
    }

    const transform = getOwner(this)!.lookup(`transform:${attributeType}`);
    assert(`Unable to find transform for '${attributeType}'`, !!transform);

    return transform;
  }),
}) as unknown as typeof ArrayTransformClass;

export default ArrayTransform;
