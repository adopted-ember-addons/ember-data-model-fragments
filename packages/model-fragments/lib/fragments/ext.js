import Store from '../store';
import Model from '../model';

var get = Ember.get;

// Add fragment creation methods to the store
Store.reopen({
  // Create a fragment with injections applied that starts
  // in the 'empty' state
  buildFragment: function(type) {
    type = this.modelFor(type);

    return type.create({
      store: this
    });
  },

  // Create a fragment that starts in the 'created' state
  createFragment: function(type, props) {
    var fragment = this.buildFragment(type);

    if (props) {
      fragment.setProperties(props);
    }

    fragment.send('loadedData');

    return fragment;
  }
});

// Add fragment support to `DS.Model`
// TODO: handle the case where there's no response to a commit, and
// in-flight attributes just get merged
Model.reopen({
  _setup: function() {
    this._super();
    this._fragments = {};
  },

  // Update all fragment data before the owner's observes fire to ensure that
  // fragment observers aren't working with stale data (this works because the
  // owner's `_data` hash has already changed by this time)
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

  adapterDidCommit: function(data) {
    this._super.apply(this, arguments);

    // Notify fragments that the record was committed
    for (var key in this._fragments) {
      this._fragments[key].adapterDidCommit();
    }
  },

  changedAttributes: function() {
    var diffData = this._super();
    var fragment;

    for (var key in this._fragments) {
      fragment = this._fragments[key];

      // An actual diff of the fragment or fragment array is outside the scope
      // of this method, so just indicate that there is a change instead
      if (get(fragment, 'isDirty')) {
        diffData[key] = true;
      }
    }

    return diffData;
  },

  rollback: function() {
    this._super();

    // Rollback fragments after data changes -- otherwise observers get tangled up
    this.rollbackFragments();
  },

  rollbackFragments: function() {
    var fragment;

    for (var key in this._fragments) {
      fragment = this._fragments[key] = this._data[key];
      fragment && fragment.rollback();
    }
  },

  // A fragment property became dirty
  fragmentDidDirty: function(key, fragment) {
    if (!get(this, 'isDeleted')) {
      // Add the fragment as a placeholder in the owner record's
      // `_attributes` hash to indicate it is dirty
      this._attributes[key] = fragment;

      this.send('becomeDirty');
    }
  },

  // A fragment property became clean
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

export default Model;
