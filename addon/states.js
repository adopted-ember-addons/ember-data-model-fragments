import { get } from '@ember/object';
import { RootState } from 'ember-data/-private';

/**
  @module ember-data-model-fragments
*/

const didSetProperty = RootState.loaded.saved.didSetProperty;
const propertyWasReset = RootState.loaded.updated.uncommitted.propertyWasReset;

const dirtySetup = function(internalModel) {
  let record = internalModel._recordData._owner;
  let key = internalModel._recordData._name;

  // A newly created fragment may not have an owner yet
  if (record) {
    fragmentDidDirty(record, key, internalModel);
  }
};

/**
  Like `DS.Model` instances, all fragments have a `currentState` property
  that reflects where they are in the model lifecycle. However, there are much
  fewer states that a fragment can be in, since the `loading` state doesn't
  apply, `inFlight` states are no different than the owner record's, and there
  is no concept of a `deleted` state.

  This is the simplified hierarchy of valid states for a fragment:

  ```text
  * root
    * empty
    * loaded
      * created
      * saved
      * updated
  ```

  Note that there are no `uncommitted` sub-states because it's implied by the
  `created` and `updated` states (since there are no `inFlight` substates).

  @class FragmentRootState
*/
let FragmentRootState = {
  // Include all `DS.Model` state booleans for consistency
  isEmpty: false,
  isLoading: false,
  isLoaded: false,
  isDirty: false,
  isSaving: false,
  isDeleted: false,
  isNew: false,
  isValid: true,

  didSetProperty: didSetProperty,

  propertyWasReset() {},

  becomeDirty() {},

  rolledBack() {},

  empty: {
    isEmpty: true,

    loadedData(internalModel) {
      internalModel.transitionTo('loaded.created');
    },

    pushedData(internalModel) {
      internalModel.transitionTo('loaded.saved');
    }
  },

  loaded: {
    unloadRecord() {
    },

    pushedData(internalModel) {
      internalModel.transitionTo('saved');
    },

    saved: {
      setup(internalModel) {
        let record = internalModel._recordData._owner;
        let key = internalModel._recordData._name;

        // Abort if fragment is still initializing
        if (!record._internalModel._recordData.getFragmentWithoutCreating(key)) {
          return;
        }

        // Reset the property on the owner record if no other siblings
        // are dirty (or there are no siblings)
        if (!get(record, `${key}.hasDirtyAttributes`)) {
          fragmentDidReset(record, key, internalModel);
        }
      },

      pushedData() {},

      didCommit() {},

      becomeDirty(internalModel) {
        internalModel.transitionTo('updated');
      }

    },

    created: {
      isDirty: true,

      isNew: true,

      setup: dirtySetup,

      didCommit(internalModel) {
        internalModel.transitionTo('saved');
      }
    },

    updated: {
      isDirty: true,

      setup: dirtySetup,

      propertyWasReset: propertyWasReset,

      didCommit(internalModel) {
        internalModel.transitionTo('saved');
      },

      rolledBack(internalModel) {
        internalModel.transitionTo('saved');
      }
    }
  }
};

function mixin(original, hash) {
  for (let prop in hash) {
    original[prop] = hash[prop];
  }

  return original;
}

// Wouldn't it be awesome if this was public?
function wireState(object, parent, name) {
  object = mixin(parent ? Object.create(parent) : {}, object);
  object.parentState = parent;
  object.stateName = name;

  for (let prop in object) {
    if (!object.hasOwnProperty(prop) || prop === 'parentState' || prop === 'stateName') {
      continue;
    }
    if (typeof object[prop] === 'object') {
      object[prop] = wireState(object[prop], object, `${name}.${prop}`);
    }
  }

  return object;
}

FragmentRootState = wireState(FragmentRootState, null, 'root');

export default FragmentRootState;

export function fragmentDidDirty(record) {
  if (!record.currentState.isDeleted) {
    record.send('becomeDirty');
  }
}

export function fragmentDidReset(record, key) {
  // Make sure there's no entry in the owner record's
  // `_attributes` hash to indicate the fragment is dirty
  // delete record._internalModel._attributes[key];

  // Don't reset if the record is new, otherwise it will enter the 'deleted' state
  // NOTE: This case almost never happens with attributes because their initial value
  // is always undefined, which is *usually* not what attributes get 'reset' to
  if (!record.currentState.isNew) {
    record.send('propertyWasReset', key);
  }
}
