// eslint-disable-next-line ember/use-ember-data-rfc-395-imports
import { RecordData } from 'ember-data/-private';
import { assert } from '@ember/debug';
import { typeOf } from '@ember/utils';
import { setProperties, get } from '@ember/object';
import { copy } from 'ember-copy';
import isInstanceOfType from './util/instance-of-type';
import { isArray } from '@ember/array';
import { fragmentDidDirty, fragmentDidReset } from './states';
import StatefulArray from './array/stateful';
import FragmentArray from './array/fragment';
import {
  setFragmentOwner,
  createFragment,
  isFragment,
  getActualFragmentType
} from './fragment';
import { gte } from 'ember-compatibility-helpers';

let fragmentRecordDatas = new WeakMap();

export default class FragmentRecordData extends RecordData {
  constructor(identifier, store) {
    if (gte('ember-data', '3.15.0')) {
      super(identifier, store);
    } else {
      super(identifier.type, identifier.id, identifier.clientId, store);
    }

    // @patocallaghan - We need to keep a copy of the record so we can recreate the fragment/fragmentArray.
    this._record = null;
    this.fragmentData = Object.create(null);
    this.serverFragments = Object.create(null);
    this.inFlightFragments = Object.create(null);

    this.fragments = Object.create(null);
    // @patocallaghan - We need to keep the fragment definitions for later on in case we need recreate the fragment or fragmentArray
    this.fragmentDefs = Object.create(null);
    let defs = store.attributesDefinitionFor(identifier.type, identifier.id, identifier.lid);

    Object.keys(defs).forEach(key => {
      let options = defs[key];
      if (options.isFragment) {
        this.fragmentDefs[key] = defs[key];
      }
    });
    fragmentRecordDatas.set(identifier, this);
  }

  // Returns the value of the property or the default propery
  getFragmentDataWithDefault(key, options, type) {
    let data = this.fragmentData[key];
    if (data !== undefined) {
      return data;
    }
    return getFragmentDefaultValue(options, type);
  }

  setupFragment(key, options, declaredModelName, record) {
    // @patocallaghan -  This is extremely janky way of making sure we always have a copy of the record saved. There must be a better way of doing this?
    this._record = record;
    let data = this.getFragmentDataWithDefault(key, options, 'object');
    let fragment = this.fragments[key];

    if (!data) {
      this.serverFragments[key] = data;
      return data;
    }

    if (!fragment) {
      fragment = createFragment(
        record.store,
        declaredModelName,
        record,
        key,
        options,
        data
      );

      this.serverFragments[key] = fragment;
    }

    return fragment;
  }

  getFragment(key, options, declaredModelName, record) {
    this._record = record;
    let fragment = this.getFragmentWithoutCreating(key);
    if (fragment === undefined) {
      return this.setupFragment(key, options, declaredModelName, record);
    } else {
      return fragment;
    }
  }

  setFragmentArrayValue(key, fragments, value, record, declaredModelName, options, isFragmentArray) {
    this._record = record;
    if (isArray(value)) {
      if (!fragments) {
        if (isFragmentArray) {
          fragments = FragmentArray.create({
            type: declaredModelName,
            options: options,
            name: key,
            owner: record
          });
        } else {
          fragments = StatefulArray.create({
            options: options,
            name: key,
            owner: record
          });
        }
      }
      fragments.setObjects(value);
    } else if (value === null) {
      fragments = null;
      this.fragments[key] = null;
    } else {
      assert('A fragment array property can only be assigned an array or null');
    }

    if (!record._internalModel._recordData.isStateInitializing()) {
      if (this.serverFragments[key] !== fragments || (fragments && get(fragments, 'hasDirtyAttributes'))) {
        fragmentDidDirty(record, key, fragments);
      } else {
        fragmentDidReset(record, key);
      }
    }

    return fragments;
  }

  setFragmentValue(key, fragment, value, record, declaredModelName, options) {

    // Model Fragments are hard tied to DS.Model, and all DS.Models have the store on them.
    // We need access to the store because EDMF uses the store for `createRecord`
    this._record = record;
    let store = record.store;
    assert(
      `You can only assign \`null\`, an object literal or a '${declaredModelName}' fragment instance to this property`,
      value === null ||
        typeOf(value) === 'object' ||
        isInstanceOfType(store.modelFor(declaredModelName), value)
    );

    // If the fragment was null before or if the new value is not of the same model as the previous one (polymorphism) we should recreate the fragment.
    const shouldRecreateFragment = !fragment || (getActualFragmentType(declaredModelName, options, value, record) !== fragment.constructor.modelName);
    if (!value) {
      fragment = null;
    } else if (isFragment(value)) {
      // A fragment instance was given, so just replace the existing value
      fragment = setFragmentOwner(value, record, key);
    } else if (shouldRecreateFragment) {
      // A property hash was given but the property was null, so create a new
      // fragment with the data
      fragment = createFragment(
        store,
        declaredModelName,
        record,
        key,
        options,
        value
      );
    } else {
      // The fragment already exists and a property hash is given, so just set
      // its values and let the state machine take care of the dirtiness
      setProperties(fragment, value);

      return fragment;
    }

    if (!record._internalModel._recordData.isStateInitializing()) {
      if (this.serverFragments[key] !== fragment) {
        this.fragments[key] = fragment;
        fragmentDidDirty(record, key, fragment);
      } else {
        fragmentDidReset(record, key);
      }
    }
    return fragment;
  }

  getFragmentArray(key, options, declaredModelName, record, isFragmentArray) {
    this._record = record;
    let data = this.getFragmentDataWithDefault(key, options, 'array');
    let fragmentArray = this.getFragmentWithoutCreating(key);

    // If we already have a processed fragment in _data and our current fragment is
    // null simply reuse the one from data. We can be in this state after a rollback
    // for example
    if (fragmentArray === undefined) {
      fragmentArray = this.setupFragmentArray(key, record, data, declaredModelName, options, isFragmentArray);
      return fragmentArray;
    } else {
      return fragmentArray;
    }
  }

  setupFragmentArray(key, record, data, declaredModelName, options, isFragmentArray) {
    this._record = record;
    let fragmentArray;
    if  (data !== null) {
      if (isFragmentArray) {
        fragmentArray = FragmentArray.create({
          type: declaredModelName,
          options: options,
          name: key,
          owner: record
        });
      } else {
        fragmentArray = StatefulArray.create({
          options: options,
          name: key,
          owner: record
        });
      }
      fragmentArray.setupData(data);
    } else {
      fragmentArray = null;
    }
    this.serverFragments[key] = fragmentArray;
    return fragmentArray;
  }

  getFragmentWithoutCreating(key) {
    if (this.fragments[key] !== undefined) {
      return this.fragments[key];
    } else if (this.inFlightFragments[key] !== undefined) {
      return this.inFlightFragments[key];
    } else if (this.serverFragments[key] !== undefined) {
      return this.serverFragments[key];
    }
  }

  isStillInitializing(key) {
    return !this.getFragmentWithoutCreating(key) || this.isStateInitializing();
  }

  isStateInitializing() {
    return gte('ember-data', '3.28.0') && !this._record.___recordState;
  }

  // PUBLIC API

  setupFragmentData(data, calculateChange) {
    let keys = [];
    if (data.attributes) {
      Object.keys(this.fragmentDefs).forEach(name => {
        if (calculateChange && this.getFragmentWithoutCreating(name) !== undefined) {
          keys.push(name);
        }
        if (name in data.attributes) {
          this.fragmentData[name] = data.attributes[name];
          let serverFragment = this.serverFragments[name];
          if (serverFragment) {
            let fragmentKeys = [];
            if (data.attributes[name] === null) {
              // if we have data with a Fragment set up, but now we've received null,
              // delete the null fragment from serverFragments.
              delete this.serverFragments[name];
            } else if (serverFragment instanceof StatefulArray) {
              serverFragment.setupData(data.attributes[name]);
            } else {
              fragmentKeys = serverFragment._internalModel._recordData.pushData({ attributes: data.attributes[name] }, calculateChange);
            }
            if (calculateChange) {
              // TODO (Custom Model Classes) cleanup this api usage
              fragmentKeys.forEach((fragmentKey) => serverFragment.notifyPropertyChange(fragmentKey));
            }
          } else if (serverFragment === null) {
            // if we received data that set the fragment to null, but now we've received different data,
            // delete the null fragment from serverFragments.
            delete this.serverFragments[name];
          }
        }
      });
    }
    return keys;
  }

  pushData(tempData, calculateChange) {
    let data = tempData;

    let ourAttributes = {};
    if (data.attributes) {
      Object.keys(this.fragmentDefs).forEach(name => {
        if (name in data.attributes) {
          ourAttributes[name] = data.attributes[name];
          delete data.attributes[name];
        }
      });
    }
    let keys = this.setupFragmentData({ attributes: ourAttributes }, calculateChange);
    let edKeys = super.pushData(data, calculateChange);
    // TODO: for some reason, tempData is actually being modified. We need to merge
    // the fragment data back in here so that it's not lost when we go back to the
    // function calling pushData.
    if (data.attributes) {
      Object.assign(data.attributes, ourAttributes);
    }

    return keys.concat(edKeys);
  }

  willCommit() {
    let key, fragment;
    for (key in this.fragments) {
      fragment = this.fragments[key];
      if (fragment) {
        // TODO (Custom Model Classes) this bad, we should keep track of fragment record datas ourself
        if (fragment.content) {
          fragment.content.forEach(frag => {
            // check to see if the array is a non-fragment array, if so, don't call
            // method on _internalModel.recordData
            // TODO: We need to add inFlight details to statefulArray, then change this.
            if (frag._internalModel) {
              frag._internalModel._recordData.willCommit();
            }
          });
        } else {
          fragment._internalModel._recordData.willCommit();
        }
      }
      delete this.fragments[key];
      this.inFlightFragments[key] = fragment;
    }
    super.willCommit();
  }

  hasChangedAttributes() {
    return super.hasChangedAttributes() ||
      Object.keys(this.fragmentDefs).some(fragmentName => {
        const fragment = this.getFragmentWithoutCreating(fragmentName);
        return fragment && fragment.hasDirtyAttributes;
      });
  }

  resetRecord() {
    super.resetRecord();
    this.resetFragments();
  }
  resetFragments() {
    let key, fragment;
    for (key in this.fragments) {
      fragment = this.fragments[key];
      if (fragment) {
        fragment.destroy();
        delete this.fragments[key];
      }
    }

    for (key in this.inFlightFragments) {
      fragment = this.inFlightFragments[key];
      if (fragment) {
        fragment.destroy();
        delete this.inFlightFragments[key];
      }
    }

    for (key in this.serverFragments) {
      fragment = this.serverFragments[key];
      if (fragment) {
        fragment.destroy();
        delete this.serverFragments[key];
      }
    }
  }

  /*
      Returns an object, whose keys are changed properties, and value is an
      [oldProp, newProp] array.

      @method changedAttributes
      @private
    */
  changedAttributes() {
    // NOTE: This is currently implemented in a very odd way in the case where the property on a fragment changes
    // In that case, the expected return of changedAttributes is [ currentFragment, currentFragment ]
    // This seems very broken, but might be a breaking change to fix.
    // See the test named `changes to fragments are indicated in the owner record\'s `changedAttributes`
    // for more details

    let ourChanges = super.changedAttributes();
    for (let key of Object.keys(this.fragmentDefs)) {
      // either the whole fragment was replaced, or a property on the fragment was replaced
      // this is the case where we replaced the whole framgent
      let newFragment;
      // We give priority to client set fragments in this.fragments but fall back to inFlight ones
      // in case the record is already on the way
      if (this.inFlightFragments[key] !== undefined) {
        // TODD this code path isn't tested right now
        newFragment = this.inFlightFragments[key];
      }
      if (this.fragments[key] !== undefined) {
        newFragment = this.fragments[key];
      }

      if (newFragment !== undefined) {
        // if we have a local fragment defined that means that we set that locally, so we need to diff against whatever was on the server
        ourChanges[key] = [this.serverFragments[key], this.fragments[key]];
      } else {
        // this is the case where the fragment did not change but the props on it might have
        // TODO diff against server
        // otherwise we check to see if there are changes on the serverFragment and in that case the whole change is just the
        // local change of that fragment
        let fragment = this.serverFragments[key];

        let hasChanged;
        if (fragment && fragment instanceof StatefulArray) {
          hasChanged = get(fragment, 'hasDirtyAttributes');
        } else if (fragment) {
          hasChanged = fragment._internalModel._recordData.hasChangedAttributes();
        }

        if (hasChanged) {
          // NOTE: As explained above, this is very odd, and we should probably change it.
          ourChanges[key] = [fragment, fragment];
        }
      }
    }
    return ourChanges;
  }

  rollbackAttributes() {
    let keys = [];
    for (let key in this.fragments) {
      keys.push(key);
      delete this.fragments[key];
    }
    Object.keys(this.fragmentDefs).forEach((key) => {
      let fragment = this.getFragmentWithoutCreating(key);
      if (fragment) {
        fragment.rollbackAttributes();
        keys.push(key);
      }
    });
    return keys.concat(super.rollbackAttributes());
  }

  didCommit(data) {
    let fragment, attributes;
    if (data && data.attributes) {
      attributes = data.attributes;
    } else {
      attributes = Object.create(null);
    }
    for (let key in this.inFlightFragments) {
      fragment = this.inFlightFragments[key];
      delete this.inFlightFragments[key];
      this.serverFragments[key] = fragment;
    }
    Object.keys(this.fragmentDefs).forEach(key => {
      fragment = this.serverFragments[key];
      // @patocallaghan - So basically if the existing fragment/fragmentArray is null but it is part of the response we need to recreate the fragment/fragment array and re-add it to the record.
      // Unfortunately we have no access to the `record` (is there a way to get it from `RecordData`?) in this codepath hence why we need to do the `this._record` hack.
      if (!fragment && attributes[key] && this._record) {
        let def = this.fragmentDefs[key];
        let declaredModelName = def.type.split('$')[1];
        if (def.type.includes('-array')) {
          fragment = this.setupFragmentArray(key, this._record, attributes[key], declaredModelName, def.options, def.type.includes('fragment-array'));
        } else {
          fragment = createFragment(this._record.store, def.type.split('$')[1], this._record, key, def.options, attributes[key]);
        }
        // @patocallaghan - Not sure of the repercussions of just re-assigning the new fragment here. Should it be done a better way?
        this._record[key] = fragment;
      }
      if (fragment) {
        fragment._didCommit(attributes[key]);
      }
      delete attributes[key];
    });
    return super.didCommit(data);
  }

  commitWasRejected() {
    let key, fragment;
    for (key in this.inFlightFragments) {
      fragment = this.inFlightFragments[key];
      delete this.inFlightFragments[key];
      if (this.fragments[key] === undefined) {
        this.fragments[key] = fragment;
      }
      if (fragment) {
        // TODO this bad, we should keep track of fragment record datas ourself
        if (fragment.content) {
          fragment.content.forEach(frag => {
            // check to see if the array is a non-fragment array, if so, don't call
            // method on _internalModel.recordData
            // TODO: We need to add inFlight details to statefulArray, then change this.
            if (frag._internalModel) {
              frag._internalModel._recordData.commitWasRejected();
            }
          });
        } else {
          fragment._internalModel._recordData.commitWasRejected();
        }
      }
    }
    return super.commitWasRejected(...arguments);
  }

  setAttr(key, value) {
    return super.setAttr(key, value);
  }

  getAttr(key) {
    return super.getAttr(key);
  }

  hasAttr(key) {
    return super.hasAttr(key);
  }

  didCreateLocally() {
    return super.didCreateLocally();
  }
}

export { fragmentRecordDatas };

// The default value of a fragment is either an array or an object,
// which should automatically get deep copied
function getFragmentDefaultValue(options, type) {
  let value;

  if (typeof options.defaultValue === 'function') {
    return options.defaultValue();
  } else if ('defaultValue' in options) {
    value = options.defaultValue;
  } else if (type === 'array') {
    value = [];
  } else {
    return null;
  }

  assert(
    `The fragment's default value must be an ${type}`,
    typeOf(value) == type || value === null
  );

  // Create a deep copy of the resulting value to avoid shared reference errors
  return copy(value, true);
}
