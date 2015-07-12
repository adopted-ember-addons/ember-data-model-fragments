import Ember from 'ember';
import StatefulArray from './stateful';
import { internalModelFor, setFragmentOwner, getActualFragmentType } from '../model';

/**
  @module ember-data.model-fragments
*/

var get = Ember.get;
var map = Ember.EnumerableUtils.map;
var computed = Ember.computed;

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

  options: null,

  init: function() {
    this._super();
    this._isInitializing = false;
  },

  /**
    @method _processData
    @private
    @param {Object} data
  */
  _processData: function(data) {
    var record = get(this, 'owner');
    var store = get(record, 'store');
    var declaredType = get(this, 'type');
    var options = get(this, 'options');
    var key = get(this, 'name');
    var content = get(this, 'content');

    // Mark the fragment array as initializing so that state changes are ignored
    // until after all fragments' data is setup
    this._isInitializing = true;

    // Map data to existing fragments and create new ones where necessary
    var processedData = map(Ember.makeArray(data), function(data, i) {
      var fragment = content[i];

      // Create a new fragment from the data array if needed
      if (!fragment) {
        var actualType = getActualFragmentType(declaredType, options, data);
        fragment = store.createFragment(actualType);

        setFragmentOwner(fragment, record, key);
      }

      // Initialize the fragment with the data
      internalModelFor(fragment).setupData({
        attributes: data
      });

      return fragment;
    });

    this._isInitializing = false;

    return processedData;
  },

  /**
    @method _createSnapshot
    @private
  */
  _createSnapshot: function() {
    // Snapshot each fragment
    return map(this, function(fragment) {
      return fragment._createSnapshot();
    });
  },

  /**
    @method adapterDidCommit
    @private
  */
  _adapterDidCommit: function(data) {
    this._super(data);

    // If the adapter update did not contain new data, just notify each fragment
    // so it can transition to a clean state
    if (!data) {
      // Notify all records of commit
      this.forEach(function(fragment, index) {
        fragment._adapterDidCommit();
      });
    }
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
  hasDirtyAttributes: computed('@each.hasDirtyAttributes', '_originalState', function() {
    return this._super() || this.isAny('hasDirtyAttributes');
  }),

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
  rollbackAttributes: function() {
    this._super();
    this.invoke('rollbackAttributes');
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
    var array = this;
    var record = get(this, 'owner');
    var key = get(this, 'name');

    // Since all array manipulation methods end up using this method, ensure
    // ensure that fragments are the correct type and have an owner and name
    if (fragments) {
      fragments.forEach(function(fragment) {
        var owner = internalModelFor(fragment)._owner;

        Ember.assert("Fragments can only belong to one owner, try copying instead", !owner || owner === record);
        Ember.assert("You can only add '" + get(array, 'type') + "' fragments to this property", (function (type) {
          if (fragment instanceof type) {
            return true;
          } else if (Ember.MODEL_FACTORY_INJECTIONS) {
            return fragment instanceof type.superclass;
          }

          return false;
        })(get(record, 'store').modelFor(get(array, 'type'))));

        if (!owner) {
          setFragmentOwner(fragment, record, key);
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
