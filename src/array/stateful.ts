import EmberObject, { get } from '@ember/object';
import { isArray } from '@ember/array';
import MutableArray from '@ember/array/mutable';
import { assert } from '@ember/debug';
import { copy } from '../util/copy.ts';
import fragmentCacheFor from '../util/fragment-cache.ts';
import type FragmentCache from '../cache/fragment-cache.ts';
import type { FragmentIdentifier } from '../-private/types.ts';

/**
  @module ember-data-model-fragments
*/

/**
  The public shape of `StatefulArray`. The runtime class is built with
  `EmberObject.extend()` (see below), so the type surface is declared here
  for consumers.
*/
export interface StatefulArray<T = unknown>
  extends EmberObject, MutableArray<T> {
  /**
    A reference to the array's owner record.

    @property owner
    @type {DS.Model}
  */
  readonly owner: unknown;

  /**
    The identifier of the owner record.

    @property identifier
    @private
    @type {StableRecordIdentifier}
  */
  identifier: FragmentIdentifier;

  /**
    The array's property name on the owner record.

    @property key
    @private
    @type {String}
  */
  key: string;

  /**
    Reference to the store

    @property store
    @private
    @type {Store}
  */
  store: any;

  /**
    Get the cache from the store

    @property cache
    @private
  */
  readonly cache: FragmentCache;

  /** @private */
  currentState: T[];

  /**
    If this property is `true` the contents of the array do not match its
    original state. The array has local changes that have not yet been saved
    by the adapter. This includes additions, removals, and reordering of
    elements.

    @property hasDirtyAttributes
    @type {Boolean}
    @readOnly
  */
  readonly hasDirtyAttributes: boolean;

  /**
    This method reverts local changes of the array's contents to its original
    state.

    @method rollbackAttributes
  */
  rollbackAttributes(): void;

  /**
    Method alias for `toArray`.

    @method serialize
    @return {Array}
  */
  serialize(): unknown[];

  /**
    Copies the array by calling copy on each of its members.

    @method copy
    @return {array} a new array
  */
  copy(): unknown[];

  toStringExtension(): string;

  /** @private */
  _setFragments(objects: T[]): void;

  /** @private */
  _createSnapshot(): unknown;

  /** @private */
  notify(): void;

  /** @private */
  retrieveLatest(): void;
}

/** The class side of `StatefulArray`. */
export interface StatefulArrayClass<Instance = StatefulArray> {
  create(props?: Record<string, unknown>): Instance;
  extend(...definitions: object[]): StatefulArrayClass<Instance>;
  // `EmberObject.extend()` yields a constructor function, so `instanceof`
  // works at runtime — declare it so consumers can narrow with it.
  new (...args: any[]): Instance;
  readonly prototype: Instance;
}

/**
  A state-aware array that is tied to an attribute of a `DS.Model` instance.

  @class StatefulArray
  @namespace MF
  @extends Ember.MutableArray
*/
// The definition is typed with `ThisType<any>` because classic `.extend()`
// object literals cannot express their own `this` type.
const definition: object & ThisType<any> = {
  get owner() {
    return this.store._instanceCache.getRecord(this.identifier);
  },

  identifier: null,

  key: null,

  store: null,

  get cache() {
    return fragmentCacheFor(this.store);
  },

  init() {
    // eslint-disable-next-line prefer-rest-params
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
    this._hasNotified = true;
    this.notifyPropertyChange('[]');
    this.notifyPropertyChange('firstObject');
    this.notifyPropertyChange('lastObject');
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

  /**
   * Unlike `setObjects`, this method avoids setting up auto-tracking,
   * which prevents a glimmer rendering error in some circumstances.
   * @see https://github.com/adopted-ember-addons/ember-data-model-fragments/pull/466
   * @param objects the new array contents
   * @private
   */
  _setFragments(objects: unknown[]) {
    if (this._isDirty) {
      this.retrieveLatest();
    }
    this.replace(0, this._length, objects);
  },

  objectAt(index: number) {
    if (this._isDirty) {
      this.retrieveLatest();
    }
    return this.currentState[index];
  },

  _normalizeData(data: unknown) {
    return data;
  },

  _getFragmentState() {
    return this.cache.getFragment(this.identifier, this.key);
  },

  _setFragmentState(array: unknown[]) {
    this.cache.setDirtyFragment(this.identifier, this.key, array);
  },

  replace(start: number, deleteCount: number, items: unknown[]) {
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
      ...items.map((item: unknown, i: number) =>
        this._normalizeData(item, start + i),
      ),
    );
    this._setFragmentState(data);
    this.notify();
  },

  retrieveLatest() {
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
    return this.cache.isFragmentDirty(this.identifier, this.key);
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
    this.cache.rollbackFragment(this.identifier, this.key);
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
  },
};

// eslint-disable-next-line ember/no-classic-classes
const StatefulArray = EmberObject.extend(
  MutableArray,
  definition,
) as unknown as StatefulArrayClass;

export default StatefulArray;
