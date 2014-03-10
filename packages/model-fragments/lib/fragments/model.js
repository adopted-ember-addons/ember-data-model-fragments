import Store from '../store';
import Model from '../model';
import FragmentRootState from './states';

var get = Ember.get;

//
// Fragment Creation
//

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

//
// Add fragment support to `DS.Model`
// TODO: handle the case where there's no response to a commit, and
// in-flight attributes just get merged
//

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
      if (fragment && fragment !== record._data[key]) {
        fragment.setupData(record._data[key]);
        record._data[key] = fragment;
      }
    }
  }),

  rollback: function() {
    this._super();

    // Rollback fragments after data changes -- otherwise observers get tangled up
    this.rollbackFragments();
  },

  rollbackFragments: function() {
    var fragment;

    for (var key in this._fragments) {
      fragment = this._fragments[key] = this._data[key];
      fragment.rollback();
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

//
// Model Fragment
//

var ModelFragment = Ember.Object.extend(Ember.Comparable, Ember.Copyable, {
  _name: null,

  _owner: null,

  currentState: FragmentRootState.empty,

  // Initialize/merge data
  setupData: function(data) {
    var store = get(this, 'store');
    var key = get(this, 'name');
    var type = store.modelFor(this.constructor);
    var serializer = store.serializerFor(type);

    // Setting data means the record is now clean
    this._attributes = {};

    // TODO: do normalization in the transform, not on the fly
    this._data = serializer.normalize(type, data, key);

    this.send('pushedData');

    this.notifyPropertyChange('data');
  },

  // Rollback the fragment
  rollback: function() {
    this._attributes = {};

    this.rollbackFragments();

    this.send('rolledBack');

    this.notifyPropertyChange('data');
  },

  // Basic identity comparison to allow `FragmentArray` to diff arrays
  compare: function(f1, f2) {
    return f1 === f2 ? 0 : 1;
  },

  // Copying a fragment has special semantics: a new fragment is created
  // in the `loaded.created` state, without the same owner set, so that it
  // can be added to another record safely
  // TODO: handle copying sub-fragments
  copy: function() {
    var store = get(this, 'store');
    var type = store.modelFor(this.constructor);
    var data = {};

    Ember.merge(data, this._data);
    Ember.merge(data, this._attributes);

    return this.store.createFragment(type, data);
  },

  toStringExtension: function() {
    return 'owner(' + get(this, '_owner.id') + ')';
  },

  init: function() {
    this._super();
    this._setup();
  }
});

//
// Borrow functionality from DS.Model
// TODO: is it easier to extend from DS.Model and disable functionality than to
// cherry-pick common functionality?
//

// Ember object prototypes are lazy-loaded
Model.proto();

var protoPropNames = [
  '_setup',
  '_unhandledEvent',
  'send',
  'transitionTo',
  'data',
  'isEmpty',
  'isLoading',
  'isLoaded',
  'isDirty',
  'isSaving',
  'isDeleted',
  'isNew',
  'isValid',
  'serialize',
  'eachAttribute',
  'fragmentDidDirty',
  'fragmentDidReset',
  'rollbackFragments'
];

var protoProps = protoPropNames.reduce(function(props, name) {
  props[name] = Model.prototype[name] || Ember.meta(Model.prototype).descs[name];
  return props;
}, {});

ModelFragment.reopen(protoProps, {
  eachRelationship: Ember.K,
  updateRecordArraysLater: Ember.K
});

var classPropNames = [
  'attributes',
  'eachAttribute',
  'transformedAttributes',
  'eachTransformedAttribute'
];

var classProps = classPropNames.reduce(function(props, name) {
  props[name] = Model[name] || Ember.meta(Model).descs[name];
  return props;
}, {});

ModelFragment.reopenClass(classProps, {
  eachRelationship: Ember.K
});

export default ModelFragment;
