import type { StatefulArray as StatefulArrayBase } from './stateful.ts';
import type Fragment from '../fragment.ts';
/**
  @module ember-data-model-fragments
*/
/**
  The public shape of `FragmentArray`. The runtime class is built with
  `StatefulArray.extend()` (see below), so the type surface is declared here
  for consumers.

  The element type is constrained on the `_isFragment` brand rather than on
  `Fragment` itself. ember-data types `Model#eachAttribute`'s callback key
  against `keyof this`, so a `Fragment` subclass that declares any attribute
  is not assignable to `Fragment` — `T extends Fragment` would reject every
  real fragment class (`FragmentArray<Address>`, ...).
*/
export interface FragmentArray<T extends Pick<Fragment, '_isFragment'> = Fragment> extends StatefulArrayBase<T> {
    /**
      The type of fragments the array contains
  
      @property modelName
      @private
      @type {String}
    */
    modelName: string | null;
    /**
      Adds an existing fragment to the end of the fragment array. Alias for
      `addObject`.
  
      @method addFragment
      @param {MF.Fragment} fragment
      @return {MF.FragmentArray} the fragment array
    */
    addFragment(fragment: T): this;
    /**
      Removes the given fragment from the array. Alias for `removeObject`.
  
      @method removeFragment
      @param {MF.Fragment} fragment
      @return {MF.FragmentArray} the fragment array
    */
    removeFragment(fragment: T): this;
    /**
      Creates a new fragment of the fragment array's type and adds it to the end
      of the fragment array.
  
      @method createFragment
      @param {Object} props
      @return {MF.Fragment} the newly added fragment
    */
    createFragment(props?: Partial<T>): T;
}
/** The class side of `FragmentArray`. */
export interface FragmentArrayClass {
    create(props?: Record<string, unknown>): FragmentArray;
    extend(...definitions: object[]): FragmentArrayClass;
    new (...args: any[]): FragmentArray;
    readonly prototype: FragmentArray;
}
declare const FragmentArray: FragmentArrayClass;
export default FragmentArray;
//# sourceMappingURL=fragment.d.ts.map