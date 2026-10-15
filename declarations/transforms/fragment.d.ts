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