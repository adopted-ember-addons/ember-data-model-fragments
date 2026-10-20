import Transform from '@ember-data/serializer/transform';
import type Store from '@ember-data/store';
/**
  @module ember-data-model-fragments
*/
/**
  The public shape of `FragmentTransform`. The runtime class is built with
  `Transform.extend()` (see below), so the type surface is declared here for
  consumers — the inferred `.extend()` type cannot be emitted in declarations.
*/
declare class FragmentTransformClass extends Transform {
    store: Store;
    type: string | null;
    polymorphicTypeProp: string | null;
    deserialize(data: any, options?: any, parentData?: any): any;
    serialize(snapshot: any): any;
    /**
      The model name for a fragment's payload data, from a string `typeKey`.
      A function `typeKey` isn't resolved here: it's called with the owner
      record, so the cache resolves it.
    */
    modelNameFor(data: any, options?: any, parentData?: any): string | null;
    deserializeSingle(data: any, options?: any, parentData?: any): any;
}
/**
  Transform for `MF.fragment` fragment attribute which delegates work to
  the fragment type's serializer

  @class FragmentTransform
  @namespace MF
  @extends DS.Transform
*/
declare const FragmentTransform: typeof FragmentTransformClass;
export default FragmentTransform;
//# sourceMappingURL=fragment.d.ts.map