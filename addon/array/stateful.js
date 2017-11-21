import { compare } from '@ember/utils';
import ArrayProxy from '@ember/array/proxy';
import { makeArray, A } from '@ember/array';
import { copy, Copyable } from 'ember-copy';
import { get, set, computed } from '@ember/object';
import { fragmentDidDirty, fragmentDidReset } from '../states';

/**
  @module ember-data-model-fragments
*/

/**
  A state-aware array that is tied to an attribute of a `DS.Model` instance.

  @class StatefulArray
  @namespace MF
  @extends Ember.ArrayProxy
*/
const StatefulArray = ArrayProxy.extend(Copyable, {
  /**
    A reference to the array's owner record.

    @property owner
    @type {DS.Model}
  */
  owner: null,

  /**
    The array's property name on the owner record.

    @property name
    @private
    @type {String}
  */
  name: null,

  init() {
    this._super(...arguments);
    this._pendingData = undefined;
    set(this, '_originalState', []);
  },

  content: computed(function() {
    return A();
  }),

  /**
    Copies the array by calling copy on each of its members.

    @method copy
    @return {array} a new array
  */
  copy() {
    return this.map(copy);
  },

  /**
    @method setupData
    @private
    @param {Object} data
  */
  setupData(data) {
    // Since replacing the contents of the array can trigger changes to fragment
    // array properties, this method can get invoked recursively with the same
    // data, so short circuit here once it's been setup the first time
    if (this._pendingData === data) {
      return;
    }

    this._pendingData = data;

    let processedData = this._normalizeData(makeArray(data));
    let content = get(this, 'content');

    // This data is canonical, so create rollback point
    set(this, '_originalState', processedData);

    // Completely replace the contents with the new data
    content.replace(0, get(content, 'length'), processedData);
    this._pendingData = undefined;
  },

  /**
    @method _normalizeData
    @private
    @param {Object} data
  */
  _normalizeData(data) {
    return data;
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
    @method _flushChangedAttributes
  */
  _flushChangedAttributes() {},

  /**
    @method _didCommit
    @private
  */
  _didCommit(data) {
    if (data) {
      this.setupData(data);
    } else {
      // Fragment array has been persisted; use the current state as the original state
      set(this, '_originalState', this.toArray());
    }
  },

  _adapterDidError(/* error */) {
    // No-Op
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
  hasDirtyAttributes: computed('[]', '_originalState', function() {

    return compare(this.toArray(), get(this, '_originalState')) !== 0;
  }),

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
    this.setObjects(get(this, '_originalState'));
  },

  /**
    Method alias for `toArray`.

    @method serialize
    @return {Array}
  */
  serialize() {
    return this.toArray();
  },

  arrayContentDidChange() {
    this._super(...arguments);

    let record = get(this, 'owner');
    let key = get(this, 'name');

    // Any change to the size of the fragment array means a potential state change
    if (get(this, 'hasDirtyAttributes')) {
      fragmentDidDirty(record, key, this);
    } else {
      fragmentDidReset(record, key);
    }
  },

  toStringExtension() {
    let ownerId = get(this, 'owner.id');
    return `owner(${ownerId})`;
  }
});

export default StatefulArray;
