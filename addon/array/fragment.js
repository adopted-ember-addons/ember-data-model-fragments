import { assert } from '@ember/debug';
import { typeOf } from '@ember/utils';
import StatefulArray from './stateful';
import { isFragment, setFragmentOwner } from '../fragment';
import isInstanceOfType from '../util/instance-of-type';
import { recordIdentifierFor } from '@ember-data/store';

/**
  @module ember-data-model-fragments
*/

/**
  A state-aware array of fragments that is tied to an attribute of a `DS.Model`
  instance. `FragmentArray` instances should not be created directly, instead
  use `MF.fragmentArray` or `MF.array`.

  @class FragmentArray
  @namespace MF
  @extends StatefulArray
*/
const FragmentArray = StatefulArray.extend({
  /**
    The type of fragments the array contains

    @property modelName
    @private
    @type {String}
  */
  modelName: null,

  _normalizeData(data, index) {
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
    return fragmentIdentifiers?.map((fragmentIdentifier) =>
      this.store._instanceCache.getRecord(fragmentIdentifier),
    );
  },

  _setFragmentState(fragments) {
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
    return this.map((fragment) => {
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
  addFragment(fragment) {
    return this.addObject(fragment);
  },

  /**
    Removes the given fragment from the array. Alias for `removeObject`.

    @method removeFragment
    @param {MF.Fragment} fragment
    @return {MF.Fragment} the removed fragment
  */
  removeFragment(fragment) {
    return this.removeObject(fragment);
  },

  /**
    Creates a new fragment of the fragment array's type and adds it to the end
    of the fragment array.

    @method createFragment
    @param {MF.Fragment} fragment
    @return {MF.Fragment} the newly added fragment
    */
  createFragment(props) {
    const fragmentIdentifier = this.cache.newFragmentIdentifierForKey(
      this.identifier,
      this.key,
      props,
    );
    const fragment = this.store._instanceCache.getRecord(
      fragmentIdentifier,
      props,
    );
    return this.pushObject(fragment);
  },
});

export default FragmentArray;
