import EmberObject, { get } from '@ember/object';
import { isArray } from '@ember/array';
import MutableArray from '@ember/array/mutable';
import { assert } from '@ember/debug';
import { copy } from '../util/copy.ts';
import fragmentCacheFor from '../util/fragment-cache.ts';

/**
  @module ember-data-model-fragments
*/

/**
  A state-aware array that is tied to an attribute of a `DS.Model` instance.

  @class StatefulArray
  @namespace MF
  @extends Ember.MutableArray
*/
// eslint-disable-next-line ember/no-classic-classes
const StatefulArray = EmberObject.extend(MutableArray, {
  /**
    A reference to the array's owner record.

    @property owner
    @type {DS.Model}
  */
  get owner() {
    return (this as any).store._instanceCache.getRecord(
      (this as any).identifier,
    );
  },

  /**
    The identifier of the owner record.

    @property identifier
    @private
    @type {StableRecordIdentifier}
  */
  identifier: null,

  /**
    The array's property name on the owner record.

    @property key
    @private
    @type {String}
  */
  key: null,

  /**
    Reference to the store

    @property store
    @private
    @type {Store}
  */
  store: null,

  /**
    Get the cache from the store

    @property cache
    @private
  */
  get cache() {
    return fragmentCacheFor((this as any).store);
  },

  init(this: any, ...args: any[]) {
    this._super(...args);
    this._length = 0;
    this.currentState = [];
    this._isUpdating = false;
    this._isDirty = false;
    this._hasNotified = false;
    this.retrieveLatest();
  },

  notify(this: any) {
    this._isDirty = true;
    this._hasNotified = true;
    this.notifyPropertyChange('[]');
    this.notifyPropertyChange('firstObject');
    this.notifyPropertyChange('lastObject');
  },

  get length() {
    const self = this as any;
    if (self._isDirty) {
      self.retrieveLatest();
    }
    // By using `get()`, the tracking system knows to pay attention to changes that occur.
    // eslint-disable-next-line ember/no-get
    get(this, '[]');

    return self._length;
  },

  /**
   * Unlike `setObjects`, this method avoids setting up auto-tracking,
   * which prevents a glimmer rendering error in some circumstances.
   * @see https://github.com/adopted-ember-addons/ember-data-model-fragments/pull/466
   * @param objects the new array contents
   * @private
   */
  _setFragments(this: any, objects: any[]) {
    if (this._isDirty) {
      this.retrieveLatest();
    }
    this.replace(0, this._length, objects);
  },

  objectAt(this: any, index: number) {
    if (this._isDirty) {
      this.retrieveLatest();
    }
    return this.currentState[index];
  },

  _normalizeData(data: any) {
    return data;
  },

  _getFragmentState(this: any) {
    return this.cache.getFragment(this.identifier, this.key);
  },

  _setFragmentState(this: any, array: any) {
    this.cache.setDirtyFragment(this.identifier, this.key, array);
  },

  replace(this: any, start: number, deleteCount: number, items: any[]) {
    assert(
      'The third argument to replace needs to be an array.',
      isArray(items),
    );
    assert(
      'Attempted to update the fragment array after it was destroyed',
      !this.isDestroyed && !this.isDestroying,
    );
    if (deleteCount === 0 && items.length === 0) {
      // array is unchanged
      return;
    }
    if (this._isDirty) {
      this.retrieveLatest();
    }
    const data = this.currentState.slice();
    data.splice(
      start,
      deleteCount,
      ...items.map((item: any, i: number) =>
        this._normalizeData(item, start + i),
      ),
    );
    this._setFragmentState(data);
    this.notify();
  },

  retrieveLatest(this: any) {
    // It's possible the parent side of the relationship may have been destroyed by this point
    if (this.isDestroyed || this.isDestroying || this._isUpdating) {
      return;
    }
    const currentState = this._getFragmentState();
    if (currentState == null) {
      // detached; the underlying fragment array was set to null after this StatefulArray was accessed
      return;
    }

    this._isDirty = false;
    this._isUpdating = true;
    this._hasNotified = false;
    this._length = currentState.length;
    this.currentState = currentState;
    this._isUpdating = false;
  },

  /**
    Copies the array by calling copy on each of its members.

    @method copy
    @return {array} a new array
  */
  copy(this: any) {
    return this.map(copy);
  },

  /**
    @method _createSnapshot
    @private
  */
  _createSnapshot(this: any) {
    // Since elements are not models, a snapshot is simply a mapping of raw values
    return this.toArray();
  },

  /**
    If this property is `true` the contents of the array do not match its
    original state. The array has local changes that have not yet been saved by
    the adapter. This includes additions, removals, and reordering of elements.

    Example

    ```javascript
    array.toArray(); // [ 'Tom', 'Yehuda' ]
    array.get('isDirty'); // false
    array.popObject(); // 'Yehuda'
    array.get('isDirty'); // true
    ```

    @property hasDirtyAttributes
    @type {Boolean}
    @readOnly
  */
  get hasDirtyAttributes() {
    const self = this as any;
    return self.cache.isFragmentDirty(self.identifier, self.key);
  },

  /**
    This method reverts local changes of the array's contents to its original
    state.

    Example

    ```javascript
    array.toArray(); // [ 'Tom', 'Yehuda' ]
    array.popObject(); // 'Yehuda'
    array.toArray(); // [ 'Tom' ]
    array.rollbackAttributes();
    array.toArray(); // [ 'Tom', 'Yehuda' ]
    ```

    @method rollbackAttributes
  */
  rollbackAttributes(this: any) {
    this.cache.rollbackFragment(this.identifier, this.key);
  },

  /**
    Method alias for `toArray`.

    @method serialize
    @return {Array}
  */
  serialize(this: any) {
    return this.toArray();
  },

  toStringExtension(this: any) {
    return `owner(${this.owner?.id})`;
  },
});

export default StatefulArray;
