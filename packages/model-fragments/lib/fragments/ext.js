import Store from '../store';
import Model from '../model';

/**
  @module ember-data.model-fragments
*/

var get = Ember.get;

/**
  @class Store
  @namespace DS
*/
Store.reopen({
  /**
    Build a new fragment of the given type with injections
    applied that starts in the 'empty' state.

    @method buildFragment
    @private
    @param {subclass of DS.ModelFragment} type
    @return {DS.ModelFragment} fragment
  */
  buildFragment: function(type) {
    type = this.modelFor(type);

    // TODO: ModelFragment should be able to be referenced by an import here,
    // but because CoreModel depends on the changes to DS.Model in this file,
    // it would create a circular reference
    Ember.assert("The '" + type + "' model must be a subclass of DS.ModelFragment", DS.ModelFragment.detect(type));

    return type.create({
      store: this
    });
  },

  /**
    Create a new fragment that does not yet have an owner record.
    The properties passed to this method are set on the newly created
    fragment.

    To create a new instance of the `name` fragment:

    ```js
    store.createFragment('name', {
      first: "Alex",
      last: "Routé"
    });
    ```

    @method createRecord
    @param {String} type
    @param {Object} properties a hash of properties to set on the
      newly created fragment.
    @return {DS.ModelFragment} fragment
  */
  createFragment: function(type, props) {
    var fragment = this.buildFragment(type);

    if (props) {
      fragment.setProperties(props);
    }

    fragment.send('loadedData');

    return fragment;
  }
});

/**
  @class Model
  @namespace DS
  */
Model.reopen({
  _setup: function() {
    this._super();
    this._fragments = {};
  },

  /**
    This method updates all fragment data _before_ the owner's observes fire
    to ensure that fragment observers aren't working with stale data (this works
    because the owner's `_data` hash has already changed by this time)

    @method updateFragmentData
    @private
    @param {DS.Model} record
  */
  updateFragmentData: Ember.beforeObserver('data', function(record) {
    var fragment;

    for (var key in record._fragments) {
      fragment = record._fragments[key];

      // The data may have updated, but not changed at all, in which case
      // treat the update as a rollback
      if (fragment && record._data[key] && fragment !== record._data[key]) {
        fragment.setupData(record._data[key]);
        record._data[key] = fragment;
      }
    }
  }),

  /**
    If the adapter did not return a hash in response to a commit,
    merge the changed attributes and relationships into the existing
    saved data and notify all fragments of the commit.

    @method adapterDidCommit
  */
  adapterDidCommit: function(data) {
    this._super.apply(this, arguments);

    var fragment;

    // Notify fragments that the record was committed
    for (var key in this._fragments) {
      fragment = this._fragments[key];
      fragment && fragment.adapterDidCommit();
    }
  },

  /**
    Returns an object, whose keys are changed properties, and value is
    an [oldProp, newProp] array. When the model has fragments that have
    changed, the property value is simply `true`.

    Example

    ```javascript
    App.Mascot = DS.Model.extend({
      type: DS.attr('string'),
      name: DS.hasOneFragment('name')
    });

    App.Name = DS.Model.extend({
      first : DS.attr('string'),
      last  : DS.attr('string')
    });

    var person = store.createRecord('person');
    person.changedAttributes(); // {}
    person.get('name').set('first', 'Tomster');
    person.set('type', 'Hamster');
    person.changedAttributes(); // { name: true, type: [undefined, 'Hamster'] }
    ```

    @method changedAttributes
    @return {Object} an object, whose keys are changed properties,
      and value is an [oldProp, newProp] array.
  */
  changedAttributes: function() {
    var diffData = this._super();

    Ember.keys(this._fragments).forEach(function(name) {
      // An actual diff of the fragment or fragment array is outside the scope
      // of this method, so just indicate that there is a change instead
      if (name in this._attributes) {
        diffData[name] = true;
      }
    }, this);

    return diffData;
  },

  /**
    If the model `isDirty` this function will discard any unsaved
    changes, recursively doing the same for all fragment properties.

    Example

    ```javascript
    record.get('name'); // 'Untitled Document'
    record.set('name', 'Doc 1');
    record.get('name'); // 'Doc 1'
    record.rollback();
    record.get('name'); // 'Untitled Document'
    ```

    @method rollback
  */
  rollback: function() {
    this._super();

    // Rollback fragments after data changes -- otherwise observers get tangled up
    this.rollbackFragments();
  },

  /**
    @method rollbackFragments
    @private
    */
  rollbackFragments: function() {
    var fragment;

    for (var key in this._fragments) {
      fragment = this._fragments[key] = this._data[key];
      fragment && fragment.rollback();
    }
  },

  /**
    @method fragmentDidDirty
    @private
  */
  fragmentDidDirty: function(key, fragment) {
    if (!get(this, 'isDeleted')) {
      // Add the fragment as a placeholder in the owner record's
      // `_attributes` hash to indicate it is dirty
      this._attributes[key] = fragment;

      this.send('becomeDirty');
    }
  },

  /**
    @method fragmentDidReset
    @private
    */
  fragmentDidReset: function(key, fragment) {
    // Make sure there's no entry in the owner record's
    // `_attributes` hash to indicate the fragment is dirty
    delete this._attributes[key];

    // Don't reset if the record is new, otherwise it will enter the 'deleted' state
    // NOTE: This case almost never happens with attributes because their initial value
    // is always undefined, which is *usually* not what attributes get 'reset' to
    if (!get(this, 'isNew')) {
      this.send('propertyWasReset', key);
    }
  }
});

export { Store, Model };
