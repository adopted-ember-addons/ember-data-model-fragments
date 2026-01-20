import { assert } from '@ember/debug';
import { typeOf } from '@ember/utils';
import { isArray } from '@ember/array';
import { diffArray } from '@ember-data/model/-private';
import { recordIdentifierFor } from '@ember-data/store';
import { getActualFragmentType, isFragment } from '../fragment';
import isInstanceOfType from '../util/instance-of-type';

/**
 * Behavior for single fragment attributes
 */
class FragmentBehavior {
  constructor(stateManager, identifier, definition) {
    this.stateManager = stateManager;
    this.identifier = identifier;
    this.definition = definition;
  }

  getDefaultValue(key) {
    const { options } = this.definition;
    if (options.defaultValue === undefined) {
      return null;
    }
    let defaultValue;
    if (typeof options.defaultValue === 'function') {
      const record = this.stateManager._getRecord(this.identifier);
      defaultValue = options.defaultValue.call(null, record, options, key);
    } else {
      defaultValue = options.defaultValue;
    }
    assert(
      "The fragment's default value must be an object or null",
      defaultValue === null ||
        typeOf(defaultValue) === 'object' ||
        isFragment(defaultValue),
    );
    if (defaultValue === null) {
      return null;
    }
    if (isFragment(defaultValue)) {
      assert(
        `The fragment's default value must be a '${this.definition.modelName}' fragment`,
        isInstanceOfType(
          this.stateManager.__storeWrapper._store.modelFor(
            this.definition.modelName,
          ),
          defaultValue,
        ),
      );
      const fragmentIdentifier = this.stateManager._identifierFor(defaultValue);
      this.stateManager.setFragmentOwner(
        fragmentIdentifier,
        this.identifier,
        key,
      );
      return fragmentIdentifier;
    }
    return this.stateManager._newFragmentIdentifier(
      this.identifier,
      this.definition,
      defaultValue,
    );
  }

  pushData(fragment, canonical) {
    assert(
      'Fragment canonical value must be an object or null',
      canonical === null || typeOf(canonical) === 'object',
    );

    if (canonical === null) {
      return null;
    }

    if (fragment) {
      this.stateManager._fragmentPushData(fragment, { attributes: canonical });
      return fragment;
    }
    return this.stateManager._newFragmentIdentifier(
      this.identifier,
      this.definition,
      canonical,
    );
  }

  willCommit(fragment) {
    this.stateManager._fragmentWillCommit(fragment);
  }

  didCommit(fragment, canonical) {
    assert(
      'Fragment canonical value must be an object',
      canonical == null || typeOf(canonical) === 'object',
    );

    if (canonical == null) {
      if (fragment) {
        this.stateManager._fragmentDidCommit(fragment, null);
      }

      if (canonical === null) {
        return null;
      }

      return fragment;
    }

    if (fragment) {
      this.stateManager._fragmentDidCommit(fragment, { attributes: canonical });
      return fragment;
    }

    return this.stateManager._newFragmentIdentifier(
      this.identifier,
      this.definition,
      canonical,
    );
  }

  commitWasRejected(fragment) {
    this.stateManager._fragmentCommitWasRejected(fragment);
  }

  rollback(fragment) {
    this.stateManager._fragmentRollbackAttributes(fragment);
  }

  unload(fragment) {
    this.stateManager._fragmentUnloadRecord(fragment);
  }

  isDirty(value, originalValue) {
    return (
      value !== originalValue ||
      (value !== null && this.stateManager.hasChangedAttributes(value))
    );
  }

  currentState(fragment) {
    return fragment === null
      ? null
      : this.stateManager.getCurrentState(fragment);
  }

  canonicalState(fragment) {
    return fragment === null
      ? null
      : this.stateManager.getCanonicalState(fragment);
  }
}

/**
 * Behavior for fragment array attributes
 */
class FragmentArrayBehavior {
  constructor(stateManager, identifier, definition) {
    this.stateManager = stateManager;
    this.identifier = identifier;
    this.definition = definition;
  }

  getDefaultValue(key) {
    const { options } = this.definition;
    if (options.defaultValue === undefined) {
      return [];
    }
    let defaultValue;
    if (typeof options.defaultValue === 'function') {
      const record = this.stateManager._getRecord(this.identifier);
      defaultValue = options.defaultValue.call(null, record, options, key);
    } else {
      defaultValue = options.defaultValue;
    }
    assert(
      "The fragment array's default value must be an array of fragments or null",
      defaultValue === null ||
        (isArray(defaultValue) &&
          defaultValue.every((v) => typeOf(v) === 'object' || isFragment(v))),
    );
    if (defaultValue === null) {
      return null;
    }
    return defaultValue.map((item) => {
      if (isFragment(item)) {
        assert(
          `The fragment array's default value can only include '${this.definition.modelName}' fragments`,
          isInstanceOfType(
            this.stateManager.__storeWrapper._store.modelFor(
              this.definition.modelName,
            ),
            item,
          ),
        );
        const fragmentIdentifier = this.stateManager._identifierFor(item);
        this.stateManager.setFragmentOwner(
          fragmentIdentifier,
          this.identifier,
          key,
        );
        return fragmentIdentifier;
      }
      return this.stateManager._newFragmentIdentifier(
        this.identifier,
        this.definition,
        item,
      );
    });
  }

  pushData(fragmentArray, canonical) {
    assert(
      'Fragment array canonical value must be an array of objects',
      canonical === null ||
        (isArray(canonical) && canonical.every((v) => typeOf(v) === 'object')),
    );

    if (canonical === null) {
      return null;
    }

    return canonical.map((attributes, i) => {
      const fragment = fragmentArray?.[i];
      if (fragment) {
        this.stateManager._fragmentPushData(fragment, { attributes });
        return fragment;
      } else {
        return this.stateManager._newFragmentIdentifier(
          this.identifier,
          this.definition,
          attributes,
        );
      }
    });
  }

  willCommit(fragmentArray) {
    fragmentArray.forEach((fragment) =>
      this.stateManager._fragmentWillCommit(fragment),
    );
  }

  didCommit(fragmentArray, canonical) {
    assert(
      'Fragment array canonical value must be an array of objects',
      canonical == null ||
        (isArray(canonical) && canonical.every((v) => typeOf(v) === 'object')),
    );

    if (canonical == null) {
      fragmentArray?.forEach((fragment) =>
        this.stateManager._fragmentDidCommit(fragment, null),
      );
      if (canonical === null) {
        return null;
      }
      return fragmentArray;
    }

    const result = canonical.map((attributes, i) => {
      const fragment = fragmentArray?.[i];
      if (fragment) {
        this.stateManager._fragmentDidCommit(fragment, { attributes });
        return fragment;
      } else {
        return this.stateManager._newFragmentIdentifier(
          this.identifier,
          this.definition,
          attributes,
        );
      }
    });

    for (let i = canonical.length; i < fragmentArray?.length; ++i) {
      this.stateManager._fragmentDidCommit(fragmentArray[i], null);
    }
    return result;
  }

  commitWasRejected(fragmentArray) {
    fragmentArray.forEach((fragment) =>
      this.stateManager._fragmentCommitWasRejected(fragment),
    );
  }

  rollback(fragmentArray) {
    fragmentArray.forEach((fragment) =>
      this.stateManager._fragmentRollbackAttributes(fragment),
    );
  }

  unload(fragmentArray) {
    fragmentArray.forEach((fragment) =>
      this.stateManager._fragmentUnloadRecord(fragment),
    );
  }

  isDirty(value, originalValue) {
    return (
      !isArrayEqual(value, originalValue) ||
      (value !== null &&
        value.some((id) => this.stateManager.hasChangedAttributes(id)))
    );
  }

  currentState(fragmentArray) {
    return fragmentArray === null
      ? null
      : fragmentArray.map((fragment) =>
          this.stateManager.getCurrentState(fragment),
        );
  }

  canonicalState(fragmentArray) {
    return fragmentArray === null
      ? null
      : fragmentArray.map((fragment) =>
          this.stateManager.getCanonicalState(fragment),
        );
  }
}

/**
 * Behavior for plain array attributes
 */
class ArrayBehavior {
  constructor(stateManager, identifier, definition) {
    this.stateManager = stateManager;
    this.identifier = identifier;
    this.definition = definition;
  }

  getDefaultValue(key) {
    const { options } = this.definition;
    if (options.defaultValue === undefined) {
      return [];
    }
    let defaultValue;
    if (typeof options.defaultValue === 'function') {
      const record = this.stateManager._getRecord(this.identifier);
      defaultValue = options.defaultValue.call(null, record, options, key);
    } else {
      defaultValue = options.defaultValue;
    }
    assert(
      "The array's default value must be an array or null",
      defaultValue === null || isArray(defaultValue),
    );
    if (defaultValue === null) {
      return null;
    }
    return defaultValue.slice();
  }

  pushData(array, canonical) {
    assert('Array value must be an array', array === null || isArray(array));
    assert(
      'Array canonical value must be an array',
      canonical === null || isArray(canonical),
    );
    if (canonical === null) {
      return null;
    }
    return canonical.slice();
  }

  willCommit() {
    // nothing to do
  }

  didCommit(array, canonical) {
    assert('Array value must be an array', array === null || isArray(array));
    assert(
      'Array canonical value must be an array',
      canonical === null || canonical === undefined || isArray(canonical),
    );
    if (canonical === null) {
      return null;
    }
    if (canonical === undefined) {
      return array;
    }
    return canonical.slice();
  }

  commitWasRejected() {
    // nothing to do
  }

  rollback() {
    // nothing to do
  }

  unload() {
    // nothing to do
  }

  isDirty(value, originalValue) {
    return !isArrayEqual(value, originalValue);
  }

  currentState(array) {
    return array === null ? null : array.slice();
  }

  canonicalState(array) {
    return array === null ? null : array.slice();
  }
}

/**
 * FragmentStateManager manages fragment-specific state keyed by identifier.
 * It replaces the per-resource FragmentRecordData with a centralized state store.
 */
export default class FragmentStateManager {
  constructor(storeWrapper) {
    this.__storeWrapper = storeWrapper;
    // Keyed by identifier.lid
    this.__fragmentData = new Map(); // canonical server state
    this.__fragments = new Map(); // dirty local state
    this.__inFlightFragments = new Map(); // in-flight state
    this.__fragmentOwners = new Map(); // fragment → {ownerIdentifier, key}
    this.__fragmentArrayCache = new Map(); // cached StatefulArray/FragmentArray instances
    this.__behaviors = new Map(); // identifier.lid → {key → Behavior}
    this.__committedFragments = new Set(); // fragments that have been committed (no longer new)
    this.__inFlightAttrValues = new Map(); // in-flight non-fragment attribute values (for commit)
  }

  get store() {
    return this.__storeWrapper._store;
  }

  _identifierFor(fragmentOrRecord) {
    // Use recordIdentifierFor for records/fragments that already exist
    // This is the correct way to get an identifier from an instantiated record
    return recordIdentifierFor(fragmentOrRecord);
  }

  _getRecord(identifier, properties) {
    return this.store._instanceCache.getRecord(identifier, properties);
  }

  _getBehaviors(identifier) {
    let behaviors = this.__behaviors.get(identifier.lid);
    if (!behaviors) {
      behaviors = Object.create(null);
      const definitions = this.__storeWrapper
        .getSchemaDefinitionService()
        .attributesDefinitionFor(identifier);
      for (const [key, definition] of Object.entries(definitions)) {
        if (!definition.isFragment) {
          continue;
        }
        switch (definition.kind) {
          case 'fragment-array':
            behaviors[key] = new FragmentArrayBehavior(
              this,
              identifier,
              definition,
            );
            break;
          case 'fragment':
            behaviors[key] = new FragmentBehavior(this, identifier, definition);
            break;
          case 'array':
            behaviors[key] = new ArrayBehavior(this, identifier, definition);
            break;
          default:
            assert(`Unsupported fragment type: ${definition.kind}`);
            break;
        }
      }
      this.__behaviors.set(identifier.lid, behaviors);
    }
    return behaviors;
  }

  _getFragmentDataMap(identifier) {
    let data = this.__fragmentData.get(identifier.lid);
    if (!data) {
      data = Object.create(null);
      this.__fragmentData.set(identifier.lid, data);
    }
    return data;
  }

  _getFragmentsMap(identifier) {
    let data = this.__fragments.get(identifier.lid);
    if (!data) {
      data = Object.create(null);
      this.__fragments.set(identifier.lid, data);
    }
    return data;
  }

  _getInFlightFragmentsMap(identifier) {
    let data = this.__inFlightFragments.get(identifier.lid);
    if (!data) {
      data = Object.create(null);
      this.__inFlightFragments.set(identifier.lid, data);
    }
    return data;
  }

  _getFragmentArrayCacheMap(identifier) {
    let cache = this.__fragmentArrayCache.get(identifier.lid);
    if (!cache) {
      cache = Object.create(null);
      this.__fragmentArrayCache.set(identifier.lid, cache);
    }
    return cache;
  }

  _getFragmentDefault(identifier, key) {
    const behaviors = this._getBehaviors(identifier);
    const behavior = behaviors[key];
    assert(
      `Attribute '${key}' for model '${identifier.type}' must be a fragment`,
      behavior != null,
    );
    assert(
      'Fragment default value was already initialized',
      !this.hasFragment(identifier, key),
    );
    const defaultValue = behavior.getDefaultValue(key);
    const fragmentData = this._getFragmentDataMap(identifier);
    fragmentData[key] = defaultValue;
    return defaultValue;
  }

  getFragment(identifier, key) {
    const fragments = this.__fragments.get(identifier.lid);
    if (fragments && key in fragments) {
      return fragments[key];
    }
    const inFlight = this.__inFlightFragments.get(identifier.lid);
    if (inFlight && key in inFlight) {
      return inFlight[key];
    }
    const fragmentData = this.__fragmentData.get(identifier.lid);
    if (fragmentData && key in fragmentData) {
      return fragmentData[key];
    }
    return this._getFragmentDefault(identifier, key);
  }

  hasFragment(identifier, key) {
    const fragments = this.__fragments.get(identifier.lid);
    if (fragments && key in fragments) {
      return true;
    }
    const inFlight = this.__inFlightFragments.get(identifier.lid);
    if (inFlight && key in inFlight) {
      return true;
    }
    const fragmentData = this.__fragmentData.get(identifier.lid);
    return fragmentData && key in fragmentData;
  }

  setDirtyFragment(identifier, key, value) {
    const behaviors = this._getBehaviors(identifier);
    const behavior = behaviors[key];
    assert(
      `Attribute '${key}' for model '${identifier.type}' must be a fragment`,
      behavior != null,
    );
    const inFlight = this.__inFlightFragments.get(identifier.lid);
    const fragmentData = this.__fragmentData.get(identifier.lid);
    let originalValue;
    if (inFlight && key in inFlight) {
      originalValue = inFlight[key];
    } else if (fragmentData && key in fragmentData) {
      originalValue = fragmentData[key];
    } else {
      originalValue = this._getFragmentDefault(identifier, key);
    }
    const isDirty = behavior.isDirty(value, originalValue);
    const oldDirty = this.isFragmentDirty(identifier, key);
    if (isDirty !== oldDirty) {
      this._notifyStateChange(identifier, key);
    }
    const fragments = this._getFragmentsMap(identifier);
    if (isDirty) {
      fragments[key] = value;
      this._fragmentDidDirty(identifier);
    } else {
      delete fragments[key];
      this._fragmentDidReset(identifier);
    }
  }

  isFragmentDirty(identifier, key) {
    const fragments = this.__fragments.get(identifier.lid);
    return fragments?.[key] !== undefined;
  }

  getFragmentOwner(identifier) {
    return this.__fragmentOwners.get(identifier.lid);
  }

  setFragmentOwner(fragmentIdentifier, ownerIdentifier, key) {
    assert(
      'Fragments can only belong to one owner, try copying instead',
      !this.__fragmentOwners.has(fragmentIdentifier.lid) ||
        this.__fragmentOwners.get(fragmentIdentifier.lid).ownerIdentifier ===
          ownerIdentifier,
    );
    this.__fragmentOwners.set(fragmentIdentifier.lid, {
      ownerIdentifier,
      key,
    });
  }

  _newFragmentIdentifierForKey(identifier, key, attributes) {
    const behaviors = this._getBehaviors(identifier);
    const behavior = behaviors[key];
    assert(
      `Attribute '${key}' for model '${identifier.type}' must be a fragment`,
      behavior != null,
    );
    return this._newFragmentIdentifier(
      identifier,
      behavior.definition,
      attributes,
    );
  }

  _newFragmentIdentifier(ownerIdentifier, definition, attributes) {
    const type = getActualFragmentType(
      definition.modelName,
      definition.options,
      attributes,
      this._getRecord(ownerIdentifier),
    );
    const fragmentIdentifier =
      this.store.identifierCache.createIdentifierForNewRecord({ type });
    this.setFragmentOwner(fragmentIdentifier, ownerIdentifier, definition.name);
    // Initialize the fragment in the cache - use clientDidCreate to set up
    // the record's internal state, then upsert to set canonical data
    this.store.cache.__innerCache.clientDidCreate(fragmentIdentifier, {});
    // Push the attributes to the inner cache
    if (attributes) {
      this.store.cache.__innerCache.upsert(
        fragmentIdentifier,
        { attributes },
        false,
      );
    }
    // Process any nested fragment attributes
    this.pushFragmentData(fragmentIdentifier, { attributes }, false);
    return fragmentIdentifier;
  }

  hasChangedAttributes(identifier) {
    // Check both fragment state and inner cache state
    return (
      this.hasChangedFragments(identifier) ||
      this.store.cache.__innerCache.hasChangedAttrs(identifier)
    );
  }

  hasChangedFragments(identifier) {
    const fragments = this.__fragments.get(identifier.lid);
    const inFlight = this.__inFlightFragments.get(identifier.lid);
    // Explicitly return boolean to ensure false instead of undefined
    return Boolean(
      (fragments && Object.keys(fragments).length > 0) ||
        (inFlight && Object.keys(inFlight).length > 0),
    );
  }

  getCanonicalState(identifier) {
    const result = {};
    const definitions = this.__storeWrapper
      .getSchemaDefinitionService()
      .attributesDefinitionFor(identifier);
    const cache = this.store.cache.__innerCache;

    // Get changed attrs from inner cache to find original values for dirty attrs
    const changedAttrs = cache.changedAttrs(identifier);

    // Get canonical values for all attributes
    for (const [key, definition] of Object.entries(definitions)) {
      if (definition.isFragment) {
        // Fragment attributes - use behavior's canonicalState
        const behaviors = this._getBehaviors(identifier);
        const behavior = behaviors[key];
        const fragmentData = this._getFragmentDataMap(identifier);
        const value =
          key in fragmentData
            ? fragmentData[key]
            : this._getFragmentDefault(identifier, key);
        result[key] = behavior.canonicalState(value);
      } else {
        // Regular attributes - get canonical (original) value
        // If attr is dirty, changedAttrs has [oldValue, newValue], use oldValue
        // Otherwise, current value = canonical value
        if (key in changedAttrs) {
          result[key] = changedAttrs[key][0]; // old (canonical) value
        } else {
          result[key] = cache.getAttr(identifier, key);
        }
      }
    }
    return result;
  }

  getCurrentState(identifier) {
    const result = {};
    const definitions = this.__storeWrapper
      .getSchemaDefinitionService()
      .attributesDefinitionFor(identifier);

    // Get current values for all attributes
    for (const [key, definition] of Object.entries(definitions)) {
      if (definition.isFragment) {
        // Fragment attributes - use behavior's currentState
        const behaviors = this._getBehaviors(identifier);
        const behavior = behaviors[key];
        result[key] = behavior.currentState(this.getFragment(identifier, key));
      } else {
        // Regular attributes - get from inner cache
        const cache = this.store.cache.__innerCache;
        result[key] = cache.getAttr(identifier, key);
      }
    }
    return result;
  }

  changedFragments(identifier) {
    const diffData = Object.create(null);
    const behaviors = this._getBehaviors(identifier);
    const fragments = this.__fragments.get(identifier.lid) || {};
    const inFlight = this.__inFlightFragments.get(identifier.lid) || {};
    const fragmentsOrInFlight =
      Object.keys(inFlight).length > 0 ? inFlight : fragments;
    const fragmentData = this._getFragmentDataMap(identifier);

    // Check keys that are in the dirty fragments map
    for (const [key, newFragment] of Object.entries(fragmentsOrInFlight)) {
      const behavior = behaviors[key];
      const oldFragment = fragmentData[key];
      diffData[key] = [
        behavior.canonicalState(oldFragment),
        behavior.currentState(newFragment),
      ];
    }

    // Also check canonical fragments that may have internal dirty state
    // (e.g., when fragment.someAttr = newValue changes the fragment's internal state)
    for (const [key, behavior] of Object.entries(behaviors)) {
      if (key in diffData) {
        continue; // Already handled above
      }
      const canonicalValue = fragmentData[key];
      if (canonicalValue && behavior.isDirty(canonicalValue, canonicalValue)) {
        // Fragment has internal dirty state but wasn't replaced
        diffData[key] = [
          behavior.canonicalState(canonicalValue),
          behavior.currentState(canonicalValue),
        ];
      }
    }

    return diffData;
  }

  _changedFragmentKeys(identifier, updates) {
    const changedKeys = [];
    const fragmentData = this._getFragmentDataMap(identifier);
    const inFlight = this.__inFlightFragments.get(identifier.lid) || {};
    const fragments = this.__fragments.get(identifier.lid) || {};
    const original = Object.assign({}, fragmentData, inFlight);
    for (const key of Object.keys(updates)) {
      if (fragments[key]) {
        continue;
      }
      const eitherIsNull = original[key] === null || updates[key] === null;
      if (
        eitherIsNull ||
        diffArray(original[key], updates[key]).firstChangeIndex !== null
      ) {
        changedKeys.push(key);
      }
    }
    return changedKeys;
  }

  pushFragmentData(identifier, data, calculateChange) {
    let changedFragmentKeys;
    const behaviors = this._getBehaviors(identifier);
    const subFragmentsToProcess = [];

    if (data.attributes) {
      for (const [key, behavior] of Object.entries(behaviors)) {
        const canonical = data.attributes[key];
        if (canonical === undefined) {
          continue;
        }
        subFragmentsToProcess.push({ key, behavior, canonical });
      }
    }

    if (subFragmentsToProcess.length > 0) {
      const newCanonicalFragments = {};
      const fragmentData = this._getFragmentDataMap(identifier);

      subFragmentsToProcess.forEach(({ key, behavior, canonical }) => {
        const current =
          key in fragmentData
            ? fragmentData[key]
            : this._getFragmentDefault(identifier, key);
        newCanonicalFragments[key] = behavior.pushData(current, canonical);
      });

      if (calculateChange) {
        changedFragmentKeys = this._changedFragmentKeys(
          identifier,
          newCanonicalFragments,
        );
      }

      Object.assign(fragmentData, newCanonicalFragments);
      changedFragmentKeys?.forEach((key) => {
        // Notify the storeWrapper that the fragment attribute changed
        this.__storeWrapper.notifyChange(identifier, 'attributes', key);
        const arrayCache = this.__fragmentArrayCache.get(identifier.lid);
        arrayCache?.[key]?.notify();
      });
    }

    return changedFragmentKeys || [];
  }

  willCommitFragments(identifier) {
    const behaviors = this._getBehaviors(identifier);
    for (const [key, behavior] of Object.entries(behaviors)) {
      const data = this.getFragment(identifier, key);
      if (data) {
        behavior.willCommit(data);
      }
    }
    const fragments = this.__fragments.get(identifier.lid);
    this.__inFlightFragments.set(
      identifier.lid,
      fragments || Object.create(null),
    );
    this.__fragments.set(identifier.lid, null);
  }

  _updateChangedFragments(identifier) {
    const fragments = this.__fragments.get(identifier.lid);
    if (!fragments) return;
    const fragmentData = this._getFragmentDataMap(identifier);
    const behaviors = this._getBehaviors(identifier);
    for (const key of Object.keys(fragments)) {
      const value = fragments[key];
      const originalValue = fragmentData[key];
      const behavior = behaviors[key];
      const isDirty = behavior.isDirty(value, originalValue);
      if (!isDirty) {
        delete fragments[key];
      }
    }
  }

  didCommitFragments(identifier, data) {
    const behaviors = this._getBehaviors(identifier);
    const newCanonicalFragments = {};
    const inFlight = this.__inFlightFragments.get(identifier.lid) || {};
    const fragmentData = this._getFragmentDataMap(identifier);

    for (const [key, behavior] of Object.entries(behaviors)) {
      let canonical;
      if (data?.attributes) {
        canonical = data.attributes[key];
      }
      const fragment = key in inFlight ? inFlight[key] : fragmentData[key];
      newCanonicalFragments[key] = behavior.didCommit(fragment, canonical);
    }

    const changedFragmentKeys = this._changedFragmentKeys(
      identifier,
      newCanonicalFragments,
    );
    Object.assign(fragmentData, newCanonicalFragments);
    this.__inFlightFragments.set(identifier.lid, null);

    this._updateChangedFragments(identifier);

    changedFragmentKeys.forEach((key) => {
      const arrayCache = this.__fragmentArrayCache.get(identifier.lid);
      arrayCache?.[key]?.notify();
    });

    return changedFragmentKeys;
  }

  commitWasRejectedFragments(identifier) {
    const behaviors = this._getBehaviors(identifier);
    const inFlight = this.__inFlightFragments.get(identifier.lid) || {};
    const fragmentData = this._getFragmentDataMap(identifier);

    for (const [key, behavior] of Object.entries(behaviors)) {
      const fragment = key in inFlight ? inFlight[key] : fragmentData[key];
      if (fragment == null) {
        continue;
      }
      behavior.commitWasRejected(fragment);
    }
    const fragments = this._getFragmentsMap(identifier);
    Object.assign(fragments, inFlight);
    this.__inFlightFragments.set(identifier.lid, null);
  }

  rollbackFragments(identifier) {
    let dirtyFragmentKeys;
    const fragments = this.__fragments.get(identifier.lid);
    if (fragments && Object.keys(fragments).length > 0) {
      dirtyFragmentKeys = Object.keys(fragments);
      dirtyFragmentKeys.forEach((key) => {
        this.rollbackFragment(identifier, key);
      });
      this.__fragments.set(identifier.lid, null);
    }
    this._notifyStateChange(identifier);
    this._fragmentDidReset(identifier);
    return dirtyFragmentKeys || [];
  }

  rollbackFragment(identifier, key) {
    const behaviors = this._getBehaviors(identifier);
    const behavior = behaviors[key];
    assert(
      `Attribute '${key}' for model '${identifier.type}' must be a fragment`,
      behavior != null,
    );
    if (!this.isFragmentDirty(identifier, key)) {
      return;
    }
    const fragments = this.__fragments.get(identifier.lid);
    if (fragments) {
      delete fragments[key];
    }
    const fragmentData = this._getFragmentDataMap(identifier);
    const fragment = fragmentData[key];
    if (fragment == null) {
      return;
    }
    behavior.rollback(fragment);
    const arrayCache = this.__fragmentArrayCache.get(identifier.lid);
    arrayCache?.[key]?.notify();

    if (!this.hasChangedAttributes(identifier)) {
      this._notifyStateChange(identifier, key);
      this._fragmentDidReset(identifier);
    }
  }

  unloadFragments(identifier) {
    const behaviors = this._getBehaviors(identifier);
    const fragments = this.__fragments.get(identifier.lid) || {};
    const inFlight = this.__inFlightFragments.get(identifier.lid) || {};
    const fragmentData = this._getFragmentDataMap(identifier);

    for (const [key, behavior] of Object.entries(behaviors)) {
      // Unload the dirty value if it's a fragment (not null)
      const fragment = fragments[key];
      if (fragment != null) {
        behavior.unload(fragment);
      }

      // Unload in-flight fragments
      const inFlightFragment = inFlight[key];
      if (inFlightFragment != null) {
        behavior.unload(inFlightFragment);
      }

      // Unload the canonical data
      const data = fragmentData[key];
      if (data != null) {
        behavior.unload(data);
      }

      // Destroy fragment array cache
      const arrayCache = this.__fragmentArrayCache.get(identifier.lid);
      arrayCache?.[key]?.destroy();
    }

    // Clean up state maps
    this.__fragmentData.delete(identifier.lid);
    this.__fragments.delete(identifier.lid);
    this.__inFlightFragments.delete(identifier.lid);
    this.__fragmentArrayCache.delete(identifier.lid);
    this.__behaviors.delete(identifier.lid);
    this.__fragmentOwners.delete(identifier.lid);
  }

  _fragmentDidDirty(identifier) {
    assert('Fragment is not dirty', this.hasChangedAttributes(identifier));
    const owner = this.__fragmentOwners.get(identifier.lid);
    if (!owner) {
      return;
    }
    const { ownerIdentifier, key } = owner;
    if (this.isFragmentDirty(ownerIdentifier, key)) {
      return;
    }
    const fragmentData = this._getFragmentDataMap(ownerIdentifier);
    assert(
      `Fragment '${key}' in owner '${ownerIdentifier.type}' has not been initialized`,
      key in fragmentData,
    );

    const fragments = this._getFragmentsMap(ownerIdentifier);
    fragments[key] = fragmentData[key];
    this._notifyStateChange(ownerIdentifier, key);
    this._fragmentDidDirty(ownerIdentifier);
  }

  _fragmentDidReset(identifier) {
    const owner = this.__fragmentOwners.get(identifier.lid);
    if (!owner) {
      return;
    }
    const { ownerIdentifier, key } = owner;
    if (!this.isFragmentDirty(ownerIdentifier, key)) {
      return;
    }

    const behaviors = this._getBehaviors(ownerIdentifier);
    const behavior = behaviors[key];
    const value = this.getFragment(ownerIdentifier, key);
    const fragmentData = this._getFragmentDataMap(ownerIdentifier);
    const originalValue = fragmentData[key];
    const isDirty = behavior.isDirty(value, originalValue);

    if (isDirty) {
      return;
    }

    const fragments = this.__fragments.get(ownerIdentifier.lid);
    if (fragments) {
      delete fragments[key];
    }
    this._notifyStateChange(ownerIdentifier, key);
    this._fragmentDidReset(ownerIdentifier);
  }

  _notifyStateChange(identifier, key) {
    this.__storeWrapper.notifyChange(identifier, 'attributes', key);
  }

  // Fragment lifecycle methods using cache API directly
  _fragmentPushData(identifier, data) {
    // Push data to the cache for the fragment
    if (data?.attributes) {
      // Use the inner cache's upsert for the fragment's own attributes
      const cache = this.store.cache.__innerCache;
      cache.upsert(identifier, data, false);
      // Notify that attributes changed so computed properties are invalidated
      for (const key of Object.keys(data.attributes)) {
        this.__storeWrapper.notifyChange(identifier, 'attributes', key);
      }
    }
    // Also process any nested fragment attributes
    this.pushFragmentData(identifier, data, false);
  }

  _fragmentWillCommit(identifier) {
    // Capture the current attribute values before commit - these are what will be committed
    const innerCache = this.store.cache.__innerCache;
    const definitions = this.__storeWrapper
      .getSchemaDefinitionService()
      .attributesDefinitionFor(identifier);

    const inFlightValues = {};
    for (const [key, definition] of Object.entries(definitions)) {
      if (!definition.isFragment) {
        // getAttr returns dirty value if exists, else canonical
        inFlightValues[key] = innerCache.getAttr(identifier, key);
      }
    }
    this.__inFlightAttrValues.set(identifier.lid, inFlightValues);

    // Signal to cache that fragment is being committed
    this.willCommitFragments(identifier);
    this.store.cache.__innerCache.willCommit(identifier);
  }

  _fragmentDidCommit(identifier, data) {
    // Signal to cache that fragment was committed
    // Mark this fragment as committed (no longer new)
    this.__committedFragments.add(identifier.lid);

    // For fragments, we can't use __innerCache.didCommit because it requires an ID match.
    // Fragments don't have server IDs, just local IDs.
    //
    // Strategy:
    // 1. Use the in-flight values captured during willCommit as the base for canonical
    // 2. Server response values take precedence over in-flight values
    // 3. Get current values - if they differ from new canonical, preserve as dirty
    // 4. Rollback to clear in-flight state
    // 5. Upsert the committed values as new canonical
    // 6. Re-apply any new dirty changes that were made during in-flight
    const innerCache = this.store.cache.__innerCache;

    // Get schema for non-fragment attributes
    const definitions = this.__storeWrapper
      .getSchemaDefinitionService()
      .attributesDefinitionFor(identifier);

    // Get the in-flight values captured during willCommit
    const inFlightValues = this.__inFlightAttrValues.get(identifier.lid) || {};
    this.__inFlightAttrValues.delete(identifier.lid);

    // Get current values (may include new dirty changes made during in-flight)
    const currentValues = {};
    for (const [key, definition] of Object.entries(definitions)) {
      if (!definition.isFragment) {
        currentValues[key] = innerCache.getAttr(identifier, key);
      }
    }

    // Server response values (if any)
    const serverAttrs = data?.attributes || {};

    // Calculate canonical values: server response > in-flight values
    const commitAttrs = {};
    const newDirtyAttrs = {};

    for (const [key, definition] of Object.entries(definitions)) {
      if (definition.isFragment) continue;

      // Determine the new canonical value
      const canonicalValue =
        serverAttrs[key] !== undefined ? serverAttrs[key] : inFlightValues[key];

      commitAttrs[key] = canonicalValue;

      // Check if there's a new dirty change made DURING in-flight
      // Current value differs from in-flight means user made changes during save
      const currentValue = currentValues[key];
      const inFlightValue = inFlightValues[key];
      if (currentValue !== inFlightValue) {
        // User made a change during in-flight - preserve it as dirty
        // (but only if it also differs from the new canonical)
        if (currentValue !== canonicalValue) {
          newDirtyAttrs[key] = currentValue;
        }
      }
    }

    // Rollback the inner cache to clear dirty/in-flight tracking
    innerCache.rollbackAttrs(identifier);

    // Push the committed values as the new canonical state
    if (Object.keys(commitAttrs).length > 0) {
      innerCache.upsert(identifier, { attributes: commitAttrs }, false);
    }

    // Re-apply any new dirty changes made during in-flight
    for (const [key, value] of Object.entries(newDirtyAttrs)) {
      innerCache.setAttr(identifier, key, value);
    }

    // Notify that attributes changed so computed properties are invalidated
    const allChangedKeys = new Set([
      ...Object.keys(commitAttrs),
      ...Object.keys(newDirtyAttrs),
    ]);
    for (const key of allChangedKeys) {
      this.__storeWrapper.notifyChange(identifier, 'attributes', key);
    }

    // Process any nested fragment attributes on this fragment
    this.didCommitFragments(identifier, data);
  }

  /**
   * Check if a fragment has been committed (is no longer new)
   */
  isFragmentCommitted(identifier) {
    return this.__committedFragments.has(identifier.lid);
  }

  _fragmentRollbackAttributes(identifier) {
    // Rollback fragment attributes
    this.rollbackFragments(identifier);
    this.store.cache.__innerCache.rollbackAttrs(identifier);
  }

  _fragmentCommitWasRejected(identifier) {
    // Signal that commit was rejected
    this.commitWasRejectedFragments(identifier);
    this.store.cache.__innerCache.commitWasRejected(identifier);
  }

  _fragmentUnloadRecord(identifier) {
    // Unload fragment-specific state first
    this.unloadFragments(identifier);

    // Use _instanceCache.unloadRecord to properly:
    // 1. Call teardownRecord which destroys the fragment instance
    // 2. Clean up the instance cache tracking
    // 3. Unload from the cache
    // This is wrapped in try/catch because the fragment may already be unloaded/destroyed
    try {
      this.store._instanceCache.unloadRecord(identifier);
    } catch {
      // Fragment may already be unloaded or destroyed
      // Fall back to just clearing the inner cache
      try {
        this.store.cache.__innerCache.unloadRecord(identifier);
      } catch {
        // May already be unloaded
      }
    }
  }
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
