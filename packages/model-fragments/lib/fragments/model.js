import Ember from 'ember';
// DS.Model gets munged to add fragment support, which must be included by CoreModel
import { Model } from './ext';

/**
  @module ember-data.model-fragments
*/

var get = Ember.get;
var create = Ember.create;
var merge = Ember.merge;

/**
  The class that all nested object structures, or 'fragments', descend from.
  Fragments are bound to a single 'owner' record (an instance of `DS.Model`)
  and cannot change owners once set. They behave like models, but they have
  no `save` method since their persistence is managed entirely through their
  owner. Because of this, a fragment's state directly influences its owner's
  state, e.g. when a record's fragment `hasDirtyAttributes`, its owner
  `hasDirtyAttributes`.

  Example:

  ```javascript
  App.Person = DS.Model.extend({
    name: DS.hasOneFragment('name')
  });

  App.Name = DS.ModelFragment.extend({
    first  : DS.attr('string'),
    last   : DS.attr('string')
  });
  ```

  With JSON response:

  ```json
  {
    "id": "1",
    "name": {
      "first": "Robert",
      "last": "Jackson"
    }
  }
  ```

  ```javascript
  var person = store.getbyid('person', '1');
  var name = person.get('name');

  person.get('hasDirtyAttributes'); // false
  name.get('hasDirtyAttributes'); // false
  name.get('first'); // 'Robert'

  name.set('first', 'The Animal');
  name.get('hasDirtyAttributes'); // true
  person.get('hasDirtyAttributes'); // true

  person.rollbackAttributes();
  name.get('first'); // 'Robert'
  person.get('hasDirtyAttributes'); // false
  person.get('hasDirtyAttributes'); // false
  ```

  @class ModelFragment
  @namespace DS
  @extends CoreModel
  @uses Ember.Comparable
  @uses Ember.Copyable
*/
var ModelFragment = Model.extend(Ember.Comparable, Ember.Copyable, {
  /**
    Compare two fragments by identity to allow `FragmentArray` to diff arrays.

    @method compare
    @param a {DS.ModelFragment} the first fragment to compare
    @param b {DS.ModelFragment} the second fragment to compare
    @return {Integer} the result of the comparison
  */
  compare: function(f1, f2) {
    return f1 === f2 ? 0 : 1;
  },

  /**
    Create a new fragment that is a copy of the current fragment. Copied
    fragments do not have the same owner record set, so they may be added
    to other records safely.

    @method copy
    @return {DS.ModelFragment} the newly created fragment
  */
  copy: function() {
    var store = get(this, 'store');
    var data = {};

    // TODO: handle copying sub-fragments
    merge(data, this._data);
    merge(data, this._attributes);

    return this.store.createFragment(this.constructor.modelName, data);
  },

  /**
    @method adapterDidCommit
  */
  _adapterDidCommit: function(data) {
    internalModelFor(this).setupData({
      attributes: data || {}
    });
  },

  toStringExtension: function() {
    return 'owner(' + get(internalModelFor(this)._owner, 'id') + ')';
  }
});

/**
 * `getActualFragmentType` returns the actual type of a fragment based on its declared type
 * and whether it is configured to be polymorphic.
 *
 * @private
 * @param {String} declaredType the type as declared by `DS.hasOneFragment` or `DS.hasManyFragments`
 * @param {Object} options the fragment options
 * @param {Object} data the fragment data
 * @return {String} the actual fragment type
 */
export function getActualFragmentType(declaredType, options, data) {
  if (!options.polymorphic || !data) {
    return declaredType;
  }

  var typeKey = options.typeKey || 'type';
  var actualType = data[typeKey];

  return actualType || declaredType;
}

// Returns the internal model for the given record/fragment
export function internalModelFor(record) {
  var internalModel = record._internalModel;

  // Ensure the internal model has a fragments hash, since we can't override the
  // constructor function anymore
  if (!internalModel._fragments) {
    internalModel._fragments = create(null);
  }

  return internalModel;
}

// Sets the owner/key values on a fragment
export function setFragmentOwner(fragment, record, key) {
  var internalModel = internalModelFor(fragment);

  Ember.assert("Fragments can only belong to one owner, try copying instead", !internalModel._owner || internalModel._owner === record);

  internalModel._owner = record;
  internalModel._name = key;

  return fragment;
}

export default ModelFragment;
