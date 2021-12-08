import EmberObject, { get } from '@ember/object';
import { isArray } from '@ember/array';
import MutableArray from '@ember/array/mutable';
import { assert } from '@ember/debug';
import { diffArray } from '@ember-data/model/-private';
import { copy, Copyable } from 'ember-copy';

/**
  @module ember-data-model-fragments
*/

/**
  A state-aware array that is tied to an attribute of a `DS.Model` instance.

  @class StatefulArray
  @namespace MF
  @extends Ember.MutableArray
*/
const StatefulArray = EmberObject.extend(MutableArray, Copyable, {
  /**
    A reference to the array's owner record.

    @property owner
    @type {DS.Model}
  */
  get owner() {
    const owner = this.recordData.getFragmentOwner();
    if (!owner) {
      return null;
    }
    return this.store._internalModelForResource(owner.identifier).getRecord();
  },

  /**
    The array's property name on the owner record.

    @property name
    @private
    @type {String}
  */
  name: null,

  init() {
    this._super(...arguments);
    this._length = 0;
    this.currentState = [];
    this._isUpdating = false;
    this._isDirty = false;
    this._hasNotified = false;
    this.retrieveLatest();
  },

  notify() {
    this._isDirty = true;
    if (this.hasArrayObservers && !this._hasNotified) {
      this.retrieveLatest();
    } else {
      this._hasNotified = true;
      this.notifyPropertyChange('[]');
      this.notifyPropertyChange('firstObject');
      this.notifyPropertyChange('lastObject');
    }
  },

  get length() {
    if (this._isDirty) {
      this.retrieveLatest();
    }
    // By using `get()`, the tracking system knows to pay attention to changes that occur.
    // eslint-disable-next-line ember/no-get
    get(this, '[]');

    return this._length;
  },

  objectAt(index) {
    if (this._isDirty) {
      this.retrieveLatest();
    }
    return this.currentState[index];
  },

  replace(start, deleteCount, items) {
    assert('The third argument to replace needs to be an array.', isArray(items));
    const data = this.currentState.slice();
    data.splice(start, deleteCount, ...items);
    this.recordData.setDirtyFragment(this.key, data);
    this.notify();
  },

  retrieveLatest() {
    // It’s possible the parent side of the relationship may have been destroyed by this point
    if (this.isDestroyed || this.isDestroying || this._isUpdating) {
      return;
    }
    const currentState = this.recordData.getFragment(this.key);
    if (currentState == null) {
      // detached
      return;
    }

    this._isDirty = false;
    this._isUpdating = true;
    if (this._hasArrayObservers && !this._hasNotified) {
      // diff to find changes
      const diff = diffArray(this.currentState, currentState);
      // it's null if no change found
      if (diff.firstChangeIndex !== null) {
        // we found a change
        this.arrayContentWillChange(diff.firstChangeIndex, diff.removedCount, diff.addedCount);
        this._length = currentState.length;
        this.currentState = currentState;
        this.arrayContentDidChange(diff.firstChangeIndex, diff.removedCount, diff.addedCount);
      }
    } else {
      this._hasNotified = false;
      this._length = currentState.length;
      this.currentState = currentState;
    }
    this._isUpdating = false;
  },

  /**
    Copies the array by calling copy on each of its members.

    @method copy
    @return {array} a new array
  */
  copy() {
    return this.map(copy);
  },

  /**
    @method _createSnapshot
    @private
  */
  _createSnapshot() {
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
    return this.recordData.isFragmentDirty(this.key);
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
  rollbackAttributes() {
    this.recordData.rollbackFragment(this.key);
  },

  /**
    Method alias for `toArray`.

    @method serialize
    @return {Array}
  */
  serialize() {
    return this.toArray();
  },

  toStringExtension() {
    return `owner(${this.owner?.id})`;
  }
});

export default StatefulArray;
