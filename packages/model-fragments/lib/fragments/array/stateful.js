import Ember from 'ember';

/**
  @module ember-data.model-fragments
*/

var get = Ember.get;
var set = Ember.set;
var splice = Array.prototype.splice;

/**
  A state-aware array that is tied to an attribute of a `DS.Model` instance.

  @class StatefulArray
  @namespace DS
  @extends Ember.ArrayProxy
*/
var StatefulArray = Ember.ArrayProxy.extend({
  /**
    A reference to the array's owner record.

    @property owner
    @private
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

  init: function() {
    this._super();
    set(this, '_originalState', []);
  },

  content: function() {
    return Ember.A();
  }.property(),

  /**
    @method setupData
    @private
    @param {Object} data
  */
  setupData: function(data) {
    var content = get(this, 'content');

    data = Ember.makeArray(data);
    set(this, '_originalState', data);

    // Completely replace the contents with the new data
    this.replaceContent(0, get(this, 'content.length'), data);
  },

  /**
    @method adapterDidCommit
  */
  adapterDidCommit: function() {
    // Fragment array has been persisted; use the current state as the original state
    set(this, '_originalState', this.toArray());
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

    @property isDirty
    @type {Boolean}
    @readOnly
  */
  isDirty: function() {
    return Ember.compare(this.toArray(), get(this, '_originalState')) !== 0;
  }.property('[]', '_originalState'),

  /**
    This method reverts local changes of the array's contents to its original
    state.

    Example

    ```javascript
    array.toArray(); // [ 'Tom', 'Yehuda' ]
    array.popObject(); // 'Yehuda'
    array.toArray(); // [ 'Tom' ]
    array.rollback();
    array.toArray(); // [ 'Tom', 'Yehuda' ]
    ```

    @method rollback
  */
  rollback: function() {
    this.setObjects(get(this, '_originalState'));
  },

  /**
    Method alias for `toArray`.

    @method serialize
    @return {Array}
  */
  serialize: function() {
    return this.toArray();
  },

  arrayContentDidChange: function() {
    this._super.apply(this, arguments);

    var record = get(this, 'owner');
    var key = get(this, 'name');

    // Any change to the size of the fragment array means a potential state change
    if (this.get('isDirty')) {
      record.fragmentDidDirty(key, this);
    } else {
      record.fragmentDidReset(key, this);
    }
  },

  toStringExtension: function() {
    return 'owner(' + get(this, 'owner.id') + ')';
  }
});

export default StatefulArray;
