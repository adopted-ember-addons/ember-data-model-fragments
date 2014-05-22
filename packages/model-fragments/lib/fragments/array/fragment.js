import Ember from 'ember';
import StatefulArray from './stateful';

/**
  @module ember-data.model-fragments
*/

var get = Ember.get;
var map = Ember.EnumerableUtils.map;

/**
  A state-aware array of fragments that is tied to an attribute of a `DS.Model`
  instance. `FragmentArray` instances should not be created directly, instead
  use the `DS.hasManyFragments` attribute.

  @class FragmentArray
  @namespace DS
  @extends StatefulArray
*/
var FragmentArray = StatefulArray.extend({
  /**
    The type of fragments the array contains

    @property type
    @private
    @type {String}
  */
  type: null,

  /**
    @method setupData
    @private
    @param {Object} data
  */
  setupData: function(data) {
    var record = get(this, 'owner');
    var store = get(record, 'store');
    var type = get(this, 'type');
    var key = get(this, 'name');
    var content = get(this, 'content');

    // Map data to existing fragments and create new ones where necessary
    data = map(Ember.makeArray(data), function(data, i) {
      var fragment = content[i];

      // Create a new fragment from the data array if needed
      if (!fragment) {
        fragment = store.buildFragment(type);

        fragment.setProperties({
          _owner : record,
          _name  : key
        });
      }

      // Initialize the fragment with the data
      fragment.setupData(data);

      return fragment;
    });

    this._super(data);
  },

  /**
    @method adapterDidCommit
  */
  adapterDidCommit: function() {
    this._super();

    // Notify all records of commit
    this.invoke('adapterDidCommit');
  },

  /**
    If this property is `true`, either the contents of the array do not match
    its original state, or one or more of the fragments in the array are dirty.

    Example

    ```javascript
    array.toArray(); // [ <Fragment:1>, <Fragment:2> ]
    array.get('isDirty'); // false
    array.get('firstObject').set('prop', 'newValue');
    array.get('isDirty'); // true
    ```

    @property isDirty
    @type {Boolean}
    @readOnly
  */
  isDirty: function() {
    return this._super() || this.isAny('isDirty');
  }.property('@each.isDirty', '_originalState'),

  /**
    This method reverts local changes of the array's contents to its original
    state, and calls `rollback` on each fragment.

    Example

    ```javascript
    array.get('firstObject').get('isDirty'); // true
    array.get('isDirty'); // true
    array.rollback();
    array.get('firstObject').get('isDirty'); // false
    array.get('isDirty'); // false
    ```

    @method rollback
  */
  rollback: function() {
    this._super();
    this.invoke('rollback');
  },

  /**
    Serializing a fragment array returns a new array containing the results of
    calling `serialize` on each fragment in the array.

    @method serialize
    @return {Array}
  */
  serialize: function() {
    return this.invoke('serialize');
  },

  replaceContent: function(idx, amt, fragments) {
    var record = get(this, 'owner');
    var store = get(record, 'store');
    var type = get(this, 'type');
    var key = get(this, 'name');
    var originalState = this.originalState;

    // Since all array manipulation methods end up using this method, ensure
    // ensure that fragments are the correct type and have an owner and name
    if (fragments) {
      fragments.forEach(function(fragment) {
        var owner = get(fragment, '_owner');

        Ember.assert("You can only add '" + type + "' fragments to this property", fragment instanceof store.modelFor(type));
        Ember.assert("Fragments can only belong to one owner, try copying instead", !owner || owner === record);

        if (!owner) {
          fragment.setProperties({
            _owner : record,
            _name  : key
          });
        }
      });
    }

    return get(this, 'content').replace(idx, amt, fragments);
  },

  /**
    Adds an existing fragment to the end of the fragment array. Alias for
    `addObject`.

    @method addFragment
    @param {DS.ModelFragment} fragment
    @return {DS.ModelFragment} the newly added fragment
  */
  addFragment: function(fragment) {
    return this.addObject(fragment);
  },

  /**
    Removes the given fragment from the array. Alias for `removeObject`.

    @method removeFragment
    @param {DS.ModelFragment} fragment
    @return {DS.ModelFragment} the removed fragment
  */
  removeFragment: function(fragment) {
    return this.removeObject(fragment);
  },

  /**
    Creates a new fragment of the fragment array's type and adds it to the end
    of the fragment array

    @method createFragment
    @param {DS.ModelFragment} fragment
    @return {DS.ModelFragment} the newly added fragment
    */
  createFragment: function(props) {
    var record = get(this, 'owner');
    var store = get(record, 'store');
    var type = get(this, 'type');
    var fragment = store.createFragment(type, props);

    return this.pushObject(fragment);
  }
});

export default FragmentArray;
