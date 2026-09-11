import { assert } from '@ember/debug';
import { typeOf } from '@ember/utils';
import { dependencySatisfies, macroCondition } from '@embroider/macros';
import StatefulArray from './stateful.ts';
import type { StatefulArray as StatefulArrayBase } from './stateful.ts';
import { isFragment, setFragmentOwner } from '../fragment.ts';
import type Fragment from '../fragment.ts';
import isInstanceOfType from '../util/instance-of-type.ts';
import { recordIdentifierFor } from '@ember-data/store';

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
export interface FragmentArray<
  T extends Pick<Fragment, '_isFragment'> = Fragment,
> extends StatefulArrayBase<T> {
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
  // `StatefulArray.extend()` yields a constructor function, so `instanceof`
  // works at runtime — declare it so consumers can narrow with it.
  new (...args: any[]): FragmentArray;
  readonly prototype: FragmentArray;
}

/**
  A state-aware array of fragments that is tied to an attribute of a `DS.Model`
  instance. `FragmentArray` instances should not be created directly, instead
  use `MF.fragmentArray` or `MF.array`.

  @class FragmentArray
  @namespace MF
  @extends StatefulArray
*/
// The definition is typed with `ThisType<any>` because classic `.extend()`
// object literals cannot express their own `this` type.
const definition: object & ThisType<any> = {
  modelName: null,

  _normalizeData(data: any, index: number) {
    assert(
      `You can only add '${this.modelName}' fragments or object literals to this property`,
      typeOf(data) === 'object' ||
        isInstanceOfType(this.store.modelFor(this.modelName), data),
    );

    if (isFragment(data)) {
      const fragmentIdentifier = recordIdentifierFor(data);
      setFragmentOwner(data, this.identifier, this.key);
      // Return the fragment record itself
      return this.store._instanceCache.getRecord(fragmentIdentifier);
    }
    const existing = this.currentState[index];
    if (existing) {
      existing.setProperties(data);
      return existing;
    }
    // Create a new fragment via the cache
    const fragmentIdentifier = this.cache.newFragmentIdentifierForKey(
      this.identifier,
      this.key,
      data,
    );
    return this.store._instanceCache.getRecord(fragmentIdentifier);
  },

  _getFragmentState() {
    const fragmentIdentifiers = this._super();
    if (fragmentIdentifiers === null) {
      return null;
    }
    return fragmentIdentifiers?.map((fragmentIdentifier: any) =>
      this.store._instanceCache.getRecord(fragmentIdentifier),
    );
  },

  _setFragmentState(fragments: any[]) {
    const fragmentIdentifiers = fragments.map((fragment) =>
      recordIdentifierFor(fragment),
    );
    this._super(fragmentIdentifiers);
  },

  /**
    @method _createSnapshot
    @private
  */
  _createSnapshot() {
    // Snapshot each fragment
    return this.map((fragment: any) => {
      return fragment._createSnapshot();
    });
  },

  /**
    If this property is `true`, either the contents of the array do not match
    its original state, or one or more of the fragments in the array are dirty.

    Example

    ```javascript
    array.toArray(); // [ <Fragment:1>, <Fragment:2> ]
    array.get('hasDirtyAttributes'); // false
    array.get('firstObject').set('prop', 'newValue');
    array.get('hasDirtyAttributes'); // true
    ```

    @property hasDirtyAttributes
    @type {Boolean}
    @readOnly
  */

  /**
    This method reverts local changes of the array's contents to its original
    state, and calls `rollbackAttributes` on each fragment.

    Example

    ```javascript
    array.get('firstObject').get('hasDirtyAttributes'); // true
    array.get('hasDirtyAttributes'); // true
    array.rollbackAttributes();
    array.get('firstObject').get('hasDirtyAttributes'); // false
    array.get('hasDirtyAttributes'); // false
    ```

    @method rollbackAttributes
  */

  /**
    Serializing a fragment array returns a new array containing the results of
    calling `serialize` on each fragment in the array.

    @method serialize
    @return {Array}
  */
  serialize() {
    return this.invoke('serialize');
  },

  /**
    Adds an existing fragment to the end of the fragment array. Alias for
    `addObject`.

    @method addFragment
    @param {MF.Fragment} fragment
    @return {MF.Fragment} the newly added fragment
  */
  addFragment(fragment: any) {
    return this.addObject(fragment);
  },

  /**
    Removes the given fragment from the array. Alias for `removeObject`.

    @method removeFragment
    @param {MF.Fragment} fragment
    @return {MF.Fragment} the removed fragment
  */
  removeFragment(fragment: any) {
    return this.removeObject(fragment);
  },

  /**
    Creates a new fragment of the fragment array's type and adds it to the end
    of the fragment array.

    @method createFragment
    @param {MF.Fragment} fragment
    @return {MF.Fragment} the newly added fragment
    */
  createFragment(props?: Record<string, unknown>) {
    const fragmentIdentifier = this.cache.newFragmentIdentifierForKey(
      this.identifier,
      this.key,
      props,
    );
    if (macroCondition(dependencySatisfies('ember-data', '>=5.8.0'))) {
      const fragment = this.store._instanceCache.getRecord(fragmentIdentifier);
      const definitions = this.store
        .getSchemaDefinitionService()
        .fields(fragmentIdentifier);

      if (props) {
        for (const [key, value] of Object.entries(props)) {
          if (!definitions.has(key)) {
            fragment.set(key, value);
          }
        }
      }

      return this.pushObject(fragment);
    }

    const fragment = this.store._instanceCache.getRecord(
      fragmentIdentifier,
      props,
    );

    return this.pushObject(fragment);
  },
};

const FragmentArray = StatefulArray.extend(
  definition,
) as unknown as FragmentArrayClass;

export default FragmentArray;
