import FragmentTransform from './fragment.ts';
/**
  @module ember-data-model-fragments
*/
/**
  The public shape of `FragmentArrayTransform`. The runtime class is built
  with `FragmentTransform.extend()` (see below), so the type surface is
  declared here for consumers — the inferred `.extend()` type cannot be
  emitted in declarations.
*/
declare class FragmentArrayTransformClass extends FragmentTransform {
}
/**
  Transform for `MF.fragmentArray` fragment attribute which delegates work to
  the fragment type's serializer

  @class FragmentArrayTransform
  @namespace MF
  @extends DS.Transform
*/
declare const FragmentArrayTransform: typeof FragmentArrayTransformClass;
export default FragmentArrayTransform;
//# sourceMappingURL=fragment-array.d.ts.map