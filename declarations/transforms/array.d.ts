import Transform from '@ember-data/serializer/transform';
import type Store from '@ember-data/store';
/**
  @module ember-data-model-fragments
*/
/**
  The public shape of `ArrayTransform`. The runtime class is built with
  `Transform.extend()` (see below), so the type surface is declared here for
  consumers — the inferred `.extend()` type cannot be emitted in declarations.
*/
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
declare const ArrayTransform: typeof ArrayTransformClass;
export default ArrayTransform;
//# sourceMappingURL=array.d.ts.map