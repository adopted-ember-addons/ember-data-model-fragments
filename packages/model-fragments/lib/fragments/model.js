import Ember from 'ember';
import CoreModel from '../core-model';
import FragmentRootState from './states';

var get = Ember.get;

var ModelFragment = CoreModel.extend(Ember.Comparable, Ember.Copyable, {
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

  adapterDidCommit: function() {
    // Merge in-flight attributes if any
    if (Ember.keys(this._inFlightAttributes).length) {
      Ember.mixin(this._data, this._inFlightAttributes);
      this._inFlightAttributes = {};
    }

    var fragment;

    // Notify fragments that the owner record was committed
    for (var key in this._fragments) {
      fragment = this._fragments[key];
      fragment && fragment.adapterDidCommit();
    }

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

export default ModelFragment;
