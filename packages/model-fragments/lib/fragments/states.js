import RootState from '../states';

var get = Ember.get;

//
// Fragment State Machine
//

var didSetProperty = RootState.loaded.saved.didSetProperty;
var propertyWasReset = RootState.loaded.updated.uncommitted.propertyWasReset;

var dirtySetup = function(fragment) {
  var record = get(fragment, '_owner');
  var key = get(fragment, '_name');

  // A newly created fragment may not have an owner yet
  if (record) {
    record.fragmentDidDirty(key, fragment);
  }
};

var FragmentRootState = {
  isEmpty: false,
  isLoading: false,
  isLoaded: false,
  isDirty: false,
  isSaving: false,
  isDeleted: false,
  isNew: false,
  isValid: true,

  didSetProperty: didSetProperty,

  propertyWasReset: Ember.K,

  becomeDirty: Ember.K,

  rolledBack: Ember.K,

  empty: {
    isEmpty: true,

    loadedData: function(fragment) {
      fragment.transitionTo('loaded.created');
    },

    pushedData: function(fragment) {
      fragment.transitionTo('loaded.saved');
    }
  },

  loaded: {
    pushedData: function(fragment) {
      fragment.transitionTo('saved');
    },

    saved: {
      setup: function(fragment) {
        var record = get(fragment, '_owner');
        var key = get(fragment, '_name');

        // Abort if fragment is still initializing
        if (!record._fragments[key]) { return; }

        // Reset the property on the owner record if no other siblings
        // are dirty (or there are no siblings)
        if (!get(record, key + '.isDirty')) {
          record.fragmentDidReset(key, fragment);
        }
      },

      pushedData: Ember.K,

      becomeDirty: function(fragment) {
        fragment.transitionTo('updated');
      }
    },

    created: {
      isDirty: true,

      setup: dirtySetup,
    },

    updated: {
      isDirty: true,

      setup: dirtySetup,

      propertyWasReset: propertyWasReset,

      rolledBack: function(fragment) {
        fragment.transitionTo('saved');
      }
    }
  }
};

function mixin(original, hash) {
  for (var prop in hash) {
    original[prop] = hash[prop];
  }

  return original;
}

// Wouldn't it be awesome if this was public?
function wireState(object, parent, name) {
  object = mixin(parent ? Ember.create(parent) : {}, object);
  object.parentState = parent;
  object.stateName = name;

  for (var prop in object) {
    if (!object.hasOwnProperty(prop) || prop === 'parentState' || prop === 'stateName') {
      continue;
    }
    if (typeof object[prop] === 'object') {
      object[prop] = wireState(object[prop], object, name + "." + prop);
    }
  }

  return object;
}

FragmentRootState = wireState(FragmentRootState, null, 'root');

export default FragmentRootState;
