import Ember from 'ember';
// DS.Model gets munged to add fragment support, which must be included by CoreModel
import { Model } from './ext';
import FragmentRootState from './states';

/**
  @module ember-data.model-fragments
*/

var get = Ember.get;

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
    The fragment's property name on the owner record.

    @property _name
    @private
    @type {String}
  */
  _name: null,

  /**
    A reference to the fragment's owner record.

    @property _owner
    @private
    @type {DS.Model}
  */
  _owner: null,

  /**
    A reference to a state object descriptor indicating fragment's current state.

    @property currentState
    @private
    @type {Object}
  */
  currentState: FragmentRootState.empty,

  /**
    @method setupData
    @private
    @param {Object} data
  */
  setupData: function(data) {
    var store = get(this, 'store');
    var type = store.modelFor(this.constructor);
    var serializer = store.serializerFor(type);

    // Setting data means the record is now clean
    this._attributes = {};

    // TODO: do normalization in the transform, not on the fly
    this._data = serializer.normalize(type, data);

    // Initiate state change
    this.send('pushedData');

    // Changed properties must be notified manually
    notifyProperties(this, Ember.keys(data));
  },

  /**
    Like `DS.Model#rollback`, if the fragment `isDirty` this function will
    discard any unsaved changes, recursively doing the same for all fragment
    properties.

    Example

    ```javascript
    fragment.get('type'); // 'Human'
    fragment.set('type', 'Hamster');
    fragment.get('type'); // 'Hamster'
    fragment.rollback();
    fragment.get('type'); // 'Human'
    ```

    @method rollback
  */
  rollback: function() {
    var toNotify = Ember.keys(this._attributes);
    this._attributes = {};

    // Rollback fragments from the bottom up
    this.rollbackFragments();

    // Initiate state change
    this.send('rolledBack');

    // Changed properties must be notified manually
    notifyProperties(this, toNotify);
  },

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
    var type = store.modelFor(this.constructor);
    var data = {};

    // TODO: handle copying sub-fragments
    Ember.merge(data, this._data);
    Ember.merge(data, this._attributes);

    return this.store.createFragment(type, data);
  },

  /**
    @method adapterDidCommit
  */
  adapterDidCommit: function() {
    // Merge in-flight attributes if any
    if (Ember.keys(this._inFlightAttributes).length) {
      Ember.mixin(this._data, this._inFlightAttributes);
      this._inFlightAttributes = {};
    }

    var fragment;

    // Notify fragments that the owner record was committed
    for (var key in this._fragments) {
      if (fragment = this._fragments[key]) {
        fragment.adapterDidCommit();
      }
    }

    // Transition directly to a clean state
    this.transitionTo('saved');
  },

  toStringExtension: function() {
    return 'owner(' + get(this, '_owner.id') + ')';
  },

  init: function() {
    this._super();
    this._setup();
  }
});

function notifyProperties(context, propNames) {
  Ember.beginPropertyChanges();
  for (var i = 0, l = propNames.length; i < l; i++) {
    context.notifyPropertyChange(propNames[i]);
  }
  Ember.endPropertyChanges();
}

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
function getActualFragmentType(declaredType, options, data) {
  if (!options.polymorphic || !data) {
    return declaredType;
  }

  var typeKey = options.typeKey || 'type';
  var actualType = data[typeKey];

  return actualType || declaredType;
}

export default ModelFragment;
export { getActualFragmentType };
