import Ember from 'ember';
// DS.Model gets munged to add fragment support, which must be included first
import { Model } from './ext';

/**
  @module ember-data-model-fragments
*/

var get = Ember.get;
var create = Object.create || Ember.create;
var copy = Ember.copy;

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
    name: MF.fragment('name')
  });

  App.Name = MF.Fragment.extend({
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

  @class Fragment
  @namespace MF
  @extends CoreModel
  @uses Ember.Comparable
  @uses Ember.Copyable
*/
var Fragment = Model.extend(Ember.Comparable, Ember.Copyable, {
  /**
    Compare two fragments by identity to allow `FragmentArray` to diff arrays.

    @method compare
    @param a {MF.Fragment} the first fragment to compare
    @param b {MF.Fragment} the second fragment to compare
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
    @return {MF.Fragment} the newly created fragment
  */
  copy: function() {
    var type = this.constructor;
    var props = create(null);

    // Loop over each attribute and copy individually to ensure nested fragments
    // are also copied
    type.eachAttribute(function(name) {
      props[name] = copy(get(this, name));
    }, this);

    return this.store.createFragment(type.modelName, props);
  },

  /**
    @method _flushChangedAttributes
  */
  _flushChangedAttributes: function() {
    internalModelFor(this).flushChangedAttributes();
  },

  /**
    @method _adapterDidCommit
  */
  _adapterDidCommit: function(data) {
    internalModelFor(this).adapterDidCommit({
      attributes: data || create(null)
    });
  },

  /**
    @method _adapterDidCommit
  */
  _adapterDidError: function(/*error*/) {
    internalModelFor(this)._saveWasRejected();
  },

  toStringExtension: function() {
    let internalModel = internalModelFor(this);
    let owner = internalModel && internalModel._owner;
    if (owner) {
      return 'owner(' + get(owner, 'id') + ')';
    } else {
      return '';
    }
  }
}).reopenClass({
  fragmentOwnerProperties: Ember.computed(function() {
    var props = [];

    this.eachComputedProperty(function(name, meta) {
      if (meta.isFragmentOwner) {
        props.push(name);
      }
    });

    return props;
  }).readOnly()
});

/**
 * `getActualFragmentType` returns the actual type of a fragment based on its declared type
 * and whether it is configured to be polymorphic.
 *
 * @private
 * @param {String} declaredType the type as declared by `MF.fragment` or `MF.fragmentArray`
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
  if (internalModel && !internalModel._fragments) {
    internalModel._fragments = create(null);
  }

  return internalModel;
}

// Sets the owner/key values on a fragment
export function setFragmentOwner(fragment, record, key) {
  var internalModel = internalModelFor(fragment);

  Ember.assert("To preserve rollback semantics, fragments can only belong to one owner. Try copying instead", !internalModel._owner || internalModel._owner === record);

  internalModel._owner = record;
  internalModel._name = key;

  // Notify any observers of `fragmentOwner` properties
  get(fragment.constructor, 'fragmentOwnerProperties').forEach(function(name) {
    fragment.notifyPropertyChange(name);
  });

  return fragment;
}

// Sets the data of a fragment and leaves the fragment in a clean state
export function setFragmentData(fragment, data) {
  internalModelFor(fragment).setupData({
    attributes: data
  });
}

// Creates a fragment and sets its owner to the given record
export function createFragment(store, declaredModelName, record, key, options, data) {
  var actualModelName = getActualFragmentType(declaredModelName, options, data);
  var fragment = store.createFragment(actualModelName);

  setFragmentOwner(fragment, record, key);
  setFragmentData(fragment, data);

  return fragment;
}

// Determine whether an object is a fragment instance using a stamp to reduce
// the number of instanceof checks
export function isFragment(obj) {
  return obj && obj._isFragment;
}

export default Fragment;
