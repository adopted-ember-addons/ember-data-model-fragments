import Ember from 'ember';
import StatefulArray from './stateful';
import {
  internalModelFor,
  setFragmentOwner,
  getActualFragmentType
} from '../model';
import isInstanceOfType from '../../util/instance-of-type';
import map from '../../util/map';

/**
  @module ember-data.model-fragments
*/

var get = Ember.get;
var computed = Ember.computed;
var typeOf = Ember.typeOf;
var makeArray = Ember.makeArray;

// Normalizes an array of object literals or fragments into fragment instances,
// reusing fragments from a source content array when possible
function normalizeFragmentArray(array, content, objs) {
  var record = get(array, 'owner');
  var store = get(record, 'store');
  var declaredType = get(array, 'type');
  var options = get(array, 'options');
  var key = get(array, 'name');
  var fragment;

  return map(makeArray(objs), function(data, index) {
    Ember.assert("You can only add '" + get(array, 'type') + "' fragments or object literals to this property", typeOf(data) === 'object' || isInstanceOfType(store.modelFor(get(array, 'type')), data));

    if (data._isFragment) {
      fragment = data;

      var owner = internalModelFor(fragment)._owner;

      Ember.assert("Fragments can only belong to one owner, try copying instead", !owner || owner === record);

      if (!owner) {
        setFragmentOwner(fragment, record, key);
      }
    } else {
      fragment = content[index];

      if (!fragment) {
        // Create a new fragment from the data if needed
        var actualType = getActualFragmentType(declaredType, options, data);

        fragment = store.createFragment(actualType);

        setFragmentOwner(fragment, record, key);
      }

      // Initialize the fragment with the data
      internalModelFor(fragment).setupData({
        attributes: data
      });
    }

    return fragment;
  });
}

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
    // Mark the fragment array as initializing so that state changes are ignored
    // until after all fragments' data is setup
    this._isInitializing = true;

    var content = get(this, 'content');
    var processedData = normalizeFragmentArray(this, content, data);

    this._isInitializing = false;

    return processedData;
  },

  /**
    @method _createSnapshot
    @private
  */
  _createSnapshot: function() {
    // Snapshot each fragment
    return this.map(function(fragment) {
      return fragment._createSnapshot();
    });
  },

  /**
    @method _flushChangedAttributes
  */
  _flushChangedAttributes: function() {
    this.map(function(fragment) {
      fragment._flushChangedAttributes();
    });
  },

  /**
    @method _adapterDidCommit
    @private
  */
  _adapterDidCommit: function(data) {
    this._super(data);

    // If the adapter update did not contain new data, just notify each fragment
    // so it can transition to a clean state
    if (!data) {
      // Notify all records of commit
      this.forEach(function(fragment) {
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

  /**
    Used to normalize data since all array manipulation methods use this method.

    @method replaceContent
    @private
  */
  replaceContent: function(index, amount, objs) {
    var content = get(this, 'content');
    var replacedContent = content.slice(index, index + amount);
    var fragments = normalizeFragmentArray(this, replacedContent, objs);

    return content.replace(index, amount, fragments);
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
