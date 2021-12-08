// eslint-disable-next-line ember/use-ember-data-rfc-395-imports
import { RecordData } from 'ember-data/-private';
import { assert } from '@ember/debug';
import { typeOf } from '@ember/utils';
import { isArray } from '@ember/array';
import { getActualFragmentType } from './fragment';

class FragmentBehavior {
  constructor(recordData, definition) {
    this.recordData = recordData;
    this.definition = definition;
  }

  pushData(fragment, canonical) {
    assert(
      'Fragment value must be a RecordData',
      fragment == null || fragment instanceof RecordData
    );
    assert(
      'Fragment canonical value must be an object or null',
      canonical === null || typeOf(canonical) === 'object'
    );

    if (canonical === null) {
      // server replaced fragment with null
      return null;
    }

    if (fragment) {
      // merge the fragment with the new data from the server
      fragment._fragmentPushData({ attributes: canonical });
      return fragment;
    }
    return this.recordData._newFragmentRecordData(this.definition, canonical);
  }

  willCommit(fragment) {
    assert(
      'Fragment value must be a RecordData',
      fragment instanceof RecordData
    );
    fragment._fragmentWillCommit();
  }

  didCommit(fragment, canonical) {
    assert(
      'Fragment value must be a RecordData',
      fragment === null || fragment instanceof RecordData
    );
    assert(
      'Fragment canonical value must be an object',
      canonical == null || typeOf(canonical) === 'object'
    );

    if (canonical == null) {
      fragment?._fragmentDidCommit(null);

      if (canonical === null) {
        // server replaced fragment with null
        return null;
      }

      // server confirmed in-flight fragment
      return fragment;
    }

    if (fragment) {
      // merge the fragment with the new data from the server
      fragment._fragmentDidCommit({ attributes: canonical });
      return fragment;
    }

    return this.recordData._newFragmentRecordData(this.definition, canonical);
  }

  commitWasRejected(fragment) {
    assert(
      'Fragment value must be a RecordData',
      fragment instanceof RecordData
    );
    fragment._fragmentCommitWasRejected();
  }

  rollback(fragment) {
    assert(
      'Fragment value must be a RecordData',
      fragment instanceof RecordData
    );
    fragment._fragmentRollbackAttributes();
  }

  unload(fragment) {
    assert(
      'Fragment value must be a RecordData',
      fragment instanceof RecordData
    );
    fragment._fragmentUnloadRecord();
  }

  isDirty(value, originalValue) {
    assert(
      'Fragment value must be a RecordData',
      value === null || value instanceof RecordData
    );
    assert(
      'Fragment original value must be a RecordData',
      originalValue === null || originalValue instanceof RecordData
    );
    return value !== originalValue || (value !== null && value.hasChangedAttributes());
  }

  currentState(fragment) {
    assert(
      'Fragment value must be a RecordData',
      fragment === null || fragment instanceof RecordData
    );
    return fragment === null ? null : fragment.getCurrentState();
  }

  canonicalState(fragment) {
    assert(
      'Fragment value must be a RecordData',
      fragment === null || fragment instanceof RecordData
    );
    return fragment === null ? null : fragment.getCanonicalState();
  }
}

class FragmentArrayBehavior {
  constructor(recordData, definition) {
    this.recordData = recordData;
    this.definition = definition;
  }

  pushData(fragmentArray, canonical) {
    assert(
      'Fragment array value must be an array of RecordData',
      fragmentArray == null || (isArray(fragmentArray) && fragmentArray.every(rd => rd instanceof RecordData))
    );
    assert(
      'Fragment array canonical value must be an array of objects',
      canonical === null || (isArray(canonical) && canonical.every(v => typeOf(v) === 'object'))
    );

    if (canonical === null) {
      // push replaced fragment array with null
      return null;
    }

    // merge the fragment array with the pushed data
    return canonical.map((attributes, i) => {
      const fragment = fragmentArray?.[i];
      if (fragment) {
        fragment._fragmentPushData({ attributes });
        return fragment;
      } else {
        return this.recordData._newFragmentRecordData(this.definition, attributes);
      }
    });
  }

  willCommit(fragmentArray) {
    assert(
      'Fragment array value must be an array of RecordData',
      isArray(fragmentArray) && fragmentArray.every(rd => rd instanceof RecordData)
    );
    fragmentArray.forEach(fragment => fragment._fragmentWillCommit());
  }

  didCommit(fragmentArray, canonical) {
    assert(
      'Fragment array value must be an array of RecordData',
      fragmentArray === null || (isArray(fragmentArray) && fragmentArray.every(rd => rd instanceof RecordData))
    );
    assert(
      'Fragment array canonical value must be an array of objects',
      canonical == null || (isArray(canonical) && canonical.every(v => typeOf(v) === 'object'))
    );

    if (canonical == null) {
      fragmentArray?.forEach(fragment => fragment._fragmentDidCommit(null));
      if (canonical === null) {
        // server replaced fragment array with null
        return null;
      }
      // server confirmed in-flight fragments
      return fragmentArray;
    }

    // merge the fragment array with the new data from the server
    const result = canonical.map((attributes, i) => {
      const fragment = fragmentArray?.[i];
      if (fragment) {
        fragment._fragmentDidCommit({ attributes });
        return fragment;
      } else {
        return this.recordData._newFragmentRecordData(this.definition, attributes);
      }
    });

    // cleanup the remaining fragments
    for (let i = canonical.length; i < fragmentArray?.length; ++i) {
      fragmentArray[i]._fragmentDidCommit(null);
    }
    return result;
  }

  commitWasRejected(fragmentArray) {
    assert(
      'Fragment array value must be an array of RecordData',
      isArray(fragmentArray) && fragmentArray.every(rd => rd instanceof RecordData)
    );
    fragmentArray.forEach(fragment => fragment._fragmentCommitWasRejected());
  }

  rollback(fragmentArray) {
    assert(
      'Fragment array value must be an array of RecordData',
      isArray(fragmentArray) && fragmentArray.every(rd => rd instanceof RecordData)
    );
    fragmentArray.forEach(fragment => fragment._fragmentRollbackAttributes());
  }

  unload(fragmentArray) {
    assert(
      'Fragment array value must be an array of RecordData',
      isArray(fragmentArray) && fragmentArray.every(rd => rd instanceof RecordData)
    );
    fragmentArray.forEach(fragment => fragment._fragmentUnloadRecord());
  }

  isDirty(value, originalValue) {
    assert(
      'Fragment array value must be an array of RecordData',
      value === null || (isArray(value) && value.every(rd => rd instanceof RecordData))
    );
    assert(
      'Fragment array original value must be an array of RecordData',
      originalValue === null || (isArray(originalValue) && originalValue.every(rd => rd instanceof RecordData))
    );
    return !isArrayEqual(value, originalValue) || (value !== null && value.some(rd => rd.hasChangedAttributes()));
  }

  currentState(fragmentArray) {
    assert(
      'Fragment array value must be an array of RecordData',
      fragmentArray === null || (isArray(fragmentArray) && fragmentArray.every(rd => rd instanceof RecordData))
    );
    return fragmentArray === null ? null : fragmentArray.map(fragment => fragment.getCurrentState());
  }

  canonicalState(fragmentArray) {
    assert(
      'Fragment array value must be an array of RecordData',
      fragmentArray === null || (isArray(fragmentArray) && fragmentArray.every(rd => rd instanceof RecordData))
    );
    return fragmentArray === null ? null : fragmentArray.map(fragment => fragment.getCanonicalState());
  }
}

class ArrayBehavior {
  constructor(recordData, definition) {
    this.recordData = recordData;
    this.definition = definition;
  }

  pushData(array, canonical) {
    assert(
      'Array value must be an array',
      array == null || isArray(array)
    );
    assert(
      'Array canonical value must be an array',
      canonical === null || isArray(canonical)
    );
    if (canonical === null) {
      return null;
    }
    return canonical.slice();
  }

  willCommit(array) {
    assert('Array value must be an array', isArray(array));
    // nothing to do
  }

  didCommit(array, canonical) {
    assert(
      'Array value must be an array',
      array === null || isArray(array)
    );
    assert(
      'Array canonical value must be an array',
      canonical === null || canonical === undefined || isArray(canonical)
    );
    if (canonical === null) {
      // server replaced array with null
      return null;
    }
    if (canonical === undefined) {
      // server confirmed in-flight array
      return array;
    }
    // server returned new canonical data
    return canonical.slice();
  }

  commitWasRejected(array) {
    assert('Array value must be an array', isArray(array));
    // nothing to do
  }

  rollback(array) {
    assert('Array value must be an array', isArray(array));
    // nothing to do
  }

  unload(array) {
    assert('Array value must be an array', isArray(array));
    // nothing to do
  }

  isDirty(value, originalValue) {
    assert('Array value must be an array', value === null || isArray(value));
    assert('Array original value must be an array', originalValue === null || isArray(originalValue));
    return !isArrayEqual(value, originalValue);
  }

  currentState(array) {
    assert('Array value must be an array', array === null || isArray(array));
    return array === null ? null : array.slice();
  }

  canonicalState(array) {
    assert('Array value must be an array', array === null || isArray(array));
    return array === null ? null : array.slice();
  }
}

export default class FragmentRecordData extends RecordData {
  constructor(identifier, storeWrapper) {
    super(identifier, storeWrapper);

    const behavior = Object.create(null);
    const definitions = this.storeWrapper.attributesDefinitionFor(this.modelName);
    for (const [key, definition] of Object.entries(definitions)) {
      if (!definition.isFragment) {
        continue;
      }
      switch (definition.kind) {
        case 'fragment-array':
          behavior[key] = new FragmentArrayBehavior(this, definition);
          break;
        case 'fragment':
          behavior[key] = new FragmentBehavior(this, definition);
          break;
        case 'array':
          behavior[key] = new ArrayBehavior(this, definition);
          break;
        default:
          assert(`Unsupported fragment type: ${definition.kind}`);
          break;
      }
    }
    this._fragmentBehavior = behavior;
  }

  getFragment(key) {
    if (key in this._fragments) {
      return this._fragments[key];
    } else if (key in this._inFlightFragments) {
      return this._inFlightFragments[key];
    } else {
      return this._fragmentData[key];
    }
  }

  hasFragment(key) {
    return key in this._fragments || key in this._inFlightFragments || key in this._fragmentData;
  }

  setDirtyFragment(key, value) {
    const behavior = this._fragmentBehavior[key];
    assert(`Attribute '${key}' for model '${this.modelName}' must be a fragment`, behavior != null);
    const originalValue = key in this._inFlightFragments ? this._inFlightFragments[key] : this._fragmentData[key];
    const isDirty = behavior.isDirty(value, originalValue);
    const oldDirty = this.isFragmentDirty(key);
    if (isDirty !== oldDirty) {
      this.notifyStateChange(key);
    }
    if (isDirty) {
      this._fragments[key] = value;
      this.fragmentDidDirty();
    } else {
      delete this._fragments[key];
      this.fragmentDidReset();
    }
    // this._fragmentArrayCache[key]?.notify();
  }

  setDirtyAttribute(key, value) {
    assert(
      `Attribute '${key}' for model '${this.modelName}' must not be a fragment`,
      this._fragmentBehavior[key] == null
    );
    const oldDirty = this.isAttrDirty(key);
    super.setDirtyAttribute(key, value);

    const isDirty = this.isAttrDirty(key);
    if (isDirty !== oldDirty) {
      this.notifyStateChange(key);
    }
    if (isDirty) {
      this.fragmentDidDirty();
    } else {
      this.fragmentDidReset();
    }
  }

  getFragmentOwner() {
    return this._fragmentOwner?.recordData;
  }

  setFragmentOwner(recordData, key) {
    assert('Fragment owner must be a RecordData', recordData instanceof RecordData);
    assert('Fragment owner key must be a fragment', recordData._fragmentBehavior[key] != null);
    assert(
      'Fragments can only belong to one owner, try copying instead',
      !this._fragmentOwner || this._fragmentOwner.recordData === recordData
    );
    this._fragmentOwner = { recordData, key };
  }

  _newFragmentRecordData(definition, attributes) {
    const type = getActualFragmentType(definition.modelName, definition.options, attributes);
    const recordData = this.storeWrapper.recordDataFor(type);
    recordData.setFragmentOwner(this, definition.name);
    recordData._fragmentPushData({ attributes });
    return recordData;
  }

  hasChangedAttributes() {
    return super.hasChangedAttributes() || this.hasChangedFragments();
  }

  hasChangedFragments() {
    return this.__fragments !== null && Object.keys(this.__fragments).length > 0;
  }

  isFragmentDirty(key) {
    return this.__fragments?.[key] !== undefined;
  }

  getCanonicalState() {
    const result = Object.assign({}, this._data);
    for (const [key, behavior] of Object.entries(this._fragmentBehavior)) {
      result[key] = behavior.canonicalState(this._fragmentData[key]);
    }
    return result;
  }

  getCurrentState() {
    const result = Object.assign({}, this._data, this._inFlightAttributes, this._attributes);
    for (const [key, behavior] of Object.entries(this._fragmentBehavior)) {
      result[key] = behavior.currentState(this.getFragment(key));
    }
    return result;
  }

  /*
      Returns an object, whose keys are changed properties, and value is an
      [oldProp, newProp] array.

      @method changedAttributes
      @private
    */
  changedAttributes() {
    const result = super.changedAttributes();
    if (this.hasChangedFragments()) {
      Object.assign(result, this.changedFragments());
    }
    return result;
  }

  changedFragments() {
    const diffData = Object.create(null);
    for (const [key, newFragment] of Object.entries(this._fragments)) {
      const behavior = this._fragmentBehavior[key];
      const oldFragment = key in this._inFlightFragments ? this._inFlightFragments[key] : this._fragmentData[key];
      diffData[key] = [behavior.canonicalState(oldFragment), behavior.currentState(newFragment)];
    }
    return diffData;
  }

  _changedFragmentKeys(updates) {
    const changedKeys = [];
    const original = Object.assign({}, this._fragmentData, this._inFlightAttributes);
    for (const key of Object.keys(updates)) {
      if (this._fragments[key]) {
        continue;
      }
      if ((updates[key] === null) !== (original[key] === null)) {
        changedKeys.push(key);
      }
    }
    return changedKeys;
  }

  pushData(data, calculateChange) {
    let changedFragmentKeys;
    if (data.attributes) {
      // copy so that we don't mutate the caller's data
      const attributes = Object.assign({}, data.attributes);
      data = Object.assign({}, data, { attributes });

      const newCanonicalFragments = {};
      for (const [key, behavior] of Object.entries(this._fragmentBehavior)) {
        const canonical = data.attributes[key];
        if (canonical === undefined) {
          continue;
        }
        // strip fragments from the attributes so the super call does not process them
        delete data.attributes[key];

        const current = this._fragmentData[key];
        newCanonicalFragments[key] = behavior.pushData(current, canonical);
      }
      if (calculateChange) {
        changedFragmentKeys = this._changedFragmentKeys(newCanonicalFragments);
      }
      Object.assign(this._fragmentData, newCanonicalFragments);
    }

    const changedAttributeKeys = super.pushData(data, calculateChange);
    return mergeArrays(changedAttributeKeys, changedFragmentKeys);
  }

  willCommit() {
    for (const [key, behavior] of Object.entries(this._fragmentBehavior)) {
      const data = this.getFragment(key);
      if (data) {
        behavior.willCommit(data);
      }
    }
    this._inFlightFragments = this._fragments;
    this._fragments = null;
    // this.notifyStateChange();
    super.willCommit();
  }

  /**
   * Checks if the fragments which are considered as changed are still
   * different to the state which is acknowledged by the server.
   *
   * This method is needed when data for the internal model is pushed and the
   * pushed data might acknowledge dirty attributes as confirmed.
   */
  _updateChangedFragments() {
    for (const key of Object.keys(this._fragments)) {
      const value = this._fragments[key];
      const originalValue = this._fragmentData[key];
      const behavior = this._fragmentBehavior[key];
      const isDirty = behavior.isDirty(value, originalValue);
      if (!isDirty) {
        delete this._fragments[key];
      }
    }
  }

  didCommit(data) {
    if (data?.attributes) {
      // copy so that we don't mutate the caller's data
      const attributes = Object.assign({}, data.attributes);
      data = Object.assign({}, data, { attributes });
    }

    const newCanonicalFragments = {};
    for (const [key, behavior] of Object.entries(this._fragmentBehavior)) {
      let canonical;
      if (data?.attributes) {
        // strip fragments from the attributes so the super call does not process them
        canonical = data.attributes[key];
        delete data.attributes[key];
      }
      const fragment = key in this._inFlightFragments ? this._inFlightFragments[key] : this._fragmentData[key];
      newCanonicalFragments[key] = behavior.didCommit(fragment, canonical);
    }

    const changedFragmentKeys = this._changedFragmentKeys(newCanonicalFragments);
    Object.assign(this._fragmentData, newCanonicalFragments);
    this._inFlightFragments = null;

    this._updateChangedFragments();

    const changedAttributeKeys = super.didCommit(data);

    // update fragment arrays
    Object.keys(newCanonicalFragments).forEach(key => this._fragmentArrayCache[key]?.notify());

    return mergeArrays(changedAttributeKeys, changedFragmentKeys);
  }

  commitWasRejected(identifier, errors) {
    for (const [key, behavior] of Object.entries(this._fragmentBehavior)) {
      const data = this._inFlightFragments[key];
      if (data == null) {
        continue;
      }
      behavior.commitWasRejected(data);
    }
    Object.assign(this._fragments, this._inFlightFragments);
    this._inFlightFragments = null;
    super.commitWasRejected(identifier, errors);
  }

  rollbackAttributes() {
    let dirtyFragmentKeys;
    if (this.hasChangedFragments()) {
      dirtyFragmentKeys = Object.keys(this._fragments);
      dirtyFragmentKeys.forEach((key) => {
        this.rollbackFragment(key);
      });
      this._fragments = null;
    }
    const dirtyAttributeKeys = super.rollbackAttributes();
    this.notifyStateChange();
    this.fragmentDidReset();
    return mergeArrays(dirtyAttributeKeys, dirtyFragmentKeys);
  }

  rollbackFragment(key) {
    const behavior = this._fragmentBehavior[key];
    assert(`Attribute '${key}' for model '${this.modelName}' must be a fragment`, behavior != null);
    if (!this.isFragmentDirty(key)) {
      return;
    }
    delete this._fragments[key];
    const fragment = this._fragmentData[key];
    if (fragment == null) {
      return;
    }
    behavior.rollback(fragment);
    this._fragmentArrayCache[key]?.notify();

    if (!this.hasChangedAttributes()) {
      this.notifyStateChange(key);
      this.fragmentDidReset();
    }
  }

  reset() {
    super.reset();
    this.__fragments = null;
    this.__inFlightFragments = null;
    this.__fragmentData = null;
    this.__fragmentArrayCache = null;
    this._fragmentOwner = null;
  }

  unloadRecord() {
    for (const [key, behavior] of Object.entries(this._fragmentBehavior)) {
      const fragment = this._fragments[key];
      if (fragment != null) {
        behavior.unload(fragment);
      }
      const inFlight = this._inFlightFragments[key];
      if (inFlight != null) {
        behavior.unload(inFlight);
      }
      const fragmentData = this._fragmentData[key];
      if (fragmentData != null) {
        behavior.unload(fragmentData);
      }
      this._fragmentArrayCache[key]?.destroy();
    }
    super.unloadRecord();
  }

  /**
   * When a fragment becomes dirty, update the dirty state of the fragment's owner
   */
  fragmentDidDirty() {
    assert('Fragment is not dirty', this.hasChangedAttributes());
    if (!this._fragmentOwner) {
      return;
    }
    const { recordData: owner, key } = this._fragmentOwner;
    if (owner.isFragmentDirty(key)) {
      // fragment owner is already dirty
      return;
    }

    owner._fragments[key] = owner._fragmentData[key];
    owner.notifyStateChange(key);
    owner.fragmentDidDirty();
  }

  /**
   * When a fragment becomes clean, update the fragment owner
   */
  fragmentDidReset() {
    if (!this._fragmentOwner) {
      return;
    }
    const { recordData: owner, key } = this._fragmentOwner;
    if (!owner.isFragmentDirty(key)) {
      // fragment owner is already clean
      return;
    }

    const behavior = owner._fragmentBehavior[key];
    const value = owner.getFragment(key);
    const originalValue = owner._fragmentData[key];
    const isDirty = behavior.isDirty(value, originalValue);

    if (isDirty) {
      // fragment is still dirty
      return;
    }

    delete owner._fragments[key];
    owner.notifyStateChange(key);
    owner.fragmentDidReset();
  }

  notifyStateChange(key) {
    this.storeWrapper.notifyStateChange(this.modelName, this.id, this.clientId, key);
  }

  /*
   * Ensure that any changes to the fragment record-data also update the InternalModel's
   * state machine and fire property change notifications on the Record
   */

  _fragmentPushData(data) {
    internalModelFor(this).setupData(data);
  }
  _fragmentWillCommit() {
    internalModelFor(this).adapterWillCommit();
  }
  _fragmentDidCommit(data) {
    internalModelFor(this).adapterDidCommit(data);
  }
  _fragmentRollbackAttributes() {
    internalModelFor(this).rollbackAttributes();
  }
  _fragmentCommitWasRejected() {
    internalModelFor(this).adapterDidInvalidate();
  }
  _fragmentUnloadRecord() {
    internalModelFor(this).unloadRecord();
  }

  /**
   * The current dirty state
   */
  get _fragments() {
    if (this.__fragments === null) {
      this.__fragments = Object.create(null);
    }
    return this.__fragments;
  }

  set _fragments(v) {
    this.__fragments = v;
  }

  /**
   * The current saved state
   */
  get _fragmentData() {
    if (this.__fragmentData === null) {
      this.__fragmentData = Object.create(null);
    }
    return this.__fragmentData;
  }

  set _fragmentData(v) {
    this.__fragmentData = v;
  }

  /**
   * The fragments which are currently being saved to the backend
   */
  get _inFlightFragments() {
    if (this.__inFlightFragments === null) {
      this.__inFlightFragments = Object.create(null);
    }
    return this.__inFlightFragments;
  }

  set _inFlightFragments(v) {
    this.__inFlightFragments = v;
  }

  /**
   * Fragment array instances
   *
   * This likely belongs in InternalModel, since ember-data caches its has-many
   * arrays in `InternalModel#_manyArrayCache`. But we can't extend InternalModel.
   */
  get _fragmentArrayCache() {
    if (this.__fragmentArrayCache === null) {
      this.__fragmentArrayCache = Object.create(null);
    }
    return this.__fragmentArrayCache;
  }
}

function internalModelFor(recordData) {
  return recordData.storeWrapper._store._internalModelForResource(recordData.identifier);
}

function isArrayEqual(a, b) {
  if (a === b) {
    return true;
  }
  if (a === null || b === null) {
    return false;
  }
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}

function mergeArrays(a, b) {
  if (b == null) {
    return a;
  }
  if (a == null) {
    return b;
  }
  return [...a, ...b];
}
