import { Model } from './ext.ts';
import type { FragmentOptions } from './-private/types.ts';
/**
  @module ember-data-model-fragments
*/
/**
 * Helper to get the FragmentRecordDataProxy for a fragment.
 * This provides backwards compatibility with existing code.
 */
export declare function fragmentRecordDataFor(fragment: any): any;
/**
  The public shape of the `Fragment` class. The runtime class is built with
  `Model.extend()` (see below), so the type surface is declared here for
  consumers.
*/
declare class FragmentClass extends Model {
    /**
      Type brand distinguishing fragments from regular models in TypeScript.
      Does not exist at runtime; use `isFragment()` for runtime checks.
    */
    _isFragment: true;
    /**
      Compare two fragments by identity to allow `FragmentArray` to diff arrays.
  
      The parameters are brand-typed rather than `Fragment`: ember-data types
      `Model#eachAttribute`'s callback key against `keyof this`, so a `Fragment`
      subclass that declares any attribute is not assignable to `Fragment`, and
      `compare(myName, myOtherName)` would not type-check.
  
      @method compare
      @param {Fragment} f1 - The first fragment to compare
      @param {Fragment} f2 - The second fragment to compare
      @return {Integer} The result of the comparison (0 if equal, 1 if not)
      @public
    */
    compare(f1: Pick<Fragment, '_isFragment'>, f2: Pick<Fragment, '_isFragment'>): number;
    /**
      Create a new fragment that is a copy of the current fragment. Copied
      fragments do not have the same owner record set, so they may be added
      to other records safely.
  
      @method copy
      @return {Fragment} The newly created fragment
      @public
    */
    copy(): this;
    /**
      @method toStringExtension
      @return {String}
      @public
    */
    toStringExtension(): string;
}
declare const Fragment: typeof FragmentClass;
type Fragment = FragmentClass;
/**
 * `getActualFragmentType` returns the actual type of a fragment based on its declared type
 * and whether it is configured to be polymorphic.
 *
 * @private
 * @param {String} declaredType the type as declared by `MF.fragment` or `MF.fragmentArray`
 * @param {Object} options the fragment options
 * @param {Object} data the fragment data
 * @return {String} the actual fragment type
 */
export declare function getActualFragmentType(declaredType: string, options: FragmentOptions<any>, data: any, owner?: any): string;
export declare function setFragmentOwner(fragment: any, ownerRecordDataOrIdentifier: any, key: string): any;
export declare function isFragment(obj: unknown): obj is Fragment;
export default Fragment;
//# sourceMappingURL=fragment.d.ts.map