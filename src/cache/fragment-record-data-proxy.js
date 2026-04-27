/**
 * FragmentRecordDataProxy provides a backwards-compatible per-resource API
 * for code that expects a RecordData instance per record/fragment.
 *
 * This is a thin wrapper that delegates to the singleton FragmentCache
 * with the appropriate identifier.
 */
export default class FragmentRecordDataProxy {
  constructor(cache, identifier) {
    this.__cache = cache;
    this.identifier = identifier;
  }

  get modelName() {
    return this.identifier.type;
  }

  get id() {
    return this.identifier.id;
  }

  get clientId() {
    return this.identifier.lid;
  }

  get storeWrapper() {
    return this.__cache.__storeWrapper;
  }

  // Fragment-specific methods
  getFragment(key) {
    return this.__cache.getFragment(this.identifier, key);
  }

  hasFragment(key) {
    return this.__cache.hasFragment(this.identifier, key);
  }

  setDirtyFragment(key, value) {
    return this.__cache.setDirtyFragment(this.identifier, key, value);
  }

  isFragmentDirty(key) {
    return this.__cache.isFragmentDirty(this.identifier, key);
  }

  getFragmentOwner() {
    const owner = this.__cache.getFragmentOwner(this.identifier);
    if (!owner) {
      return null;
    }
    // Return a proxy for the owner for backwards compatibility
    return this.__cache.createFragmentRecordData(owner.ownerIdentifier);
  }

  setFragmentOwner(ownerRecordData, key) {
    const ownerIdentifier = ownerRecordData.identifier || ownerRecordData;
    return this.__cache.setFragmentOwner(this.identifier, ownerIdentifier, key);
  }

  _newFragmentRecordDataForKey(key, attributes) {
    const fragmentIdentifier = this.__cache.newFragmentIdentifierForKey(
      this.identifier,
      key,
      attributes,
    );
    return this.__cache.createFragmentRecordData(fragmentIdentifier);
  }

  _newFragmentRecordData(definition, attributes) {
    // This is called with a definition object, not a key
    // We need to delegate to the fragment state manager
    const fragmentIdentifier =
      this.__cache.__fragmentState._newFragmentIdentifier(
        this.identifier,
        definition,
        attributes,
      );
    return this.__cache.createFragmentRecordData(fragmentIdentifier);
  }

  get _fragmentArrayCache() {
    return this.__cache.__fragmentState._getFragmentArrayCacheMap(
      this.identifier,
    );
  }

  rollbackFragment(key) {
    return this.__cache.rollbackFragment(this.identifier, key);
  }

  hasChangedFragments() {
    return this.__cache.hasChangedFragments(this.identifier);
  }

  changedFragments() {
    return this.__cache.changedFragments(this.identifier);
  }

  // Standard RecordData-like methods
  hasChangedAttributes() {
    return this.__cache.hasChangedAttrs(this.identifier);
  }

  changedAttributes() {
    return this.__cache.changedAttrs(this.identifier);
  }

  getCanonicalState() {
    // Get both regular attrs and fragment canonical state
    const fragmentState = this.__cache.getFragmentCanonicalState(
      this.identifier,
    );
    const regularState = this.__cache.peek(this.identifier);
    return Object.assign({}, regularState?.attributes || {}, fragmentState);
  }

  getCurrentState() {
    // Get both regular attrs and fragment current state
    const fragmentState = this.__cache.getFragmentCurrentState(this.identifier);
    const regularState = {};

    // Get regular attributes from cache
    const definitions = this.__cache.__storeWrapper
      .getSchemaDefinitionService()
      .attributesDefinitionFor(this.identifier);
    for (const [key, definition] of Object.entries(definitions)) {
      const isFragmentAttr =
        definition.isFragment || definition.options?.isFragment;
      if (!isFragmentAttr) {
        regularState[key] = this.__cache.getAttr(this.identifier, key);
      }
    }

    return Object.assign({}, regularState, fragmentState);
  }

  setDirtyAttribute(key, value) {
    return this.__cache.setAttr(this.identifier, key, value);
  }

  getAttr(key) {
    return this.__cache.getAttr(this.identifier, key);
  }

  rollbackAttributes() {
    return this.__cache.rollbackAttrs(this.identifier);
  }

  isEmpty() {
    return this.__cache.isEmpty(this.identifier);
  }

  isNew() {
    return this.__cache.isNew(this.identifier);
  }

  isDeleted() {
    return this.__cache.isDeleted(this.identifier);
  }

  // Methods for InternalModel compatibility
  _fragmentGetRecord(properties) {
    return this.__cache.__fragmentState._getRecord(this.identifier, properties);
  }

  _fragmentPushData(data) {
    this.__cache.__fragmentState._fragmentPushData(this.identifier, data);
  }

  _fragmentWillCommit() {
    this.__cache.__fragmentState._fragmentWillCommit(this.identifier);
  }

  _fragmentDidCommit(data) {
    this.__cache.__fragmentState._fragmentDidCommit(this.identifier, data);
  }

  _fragmentRollbackAttributes() {
    this.__cache.__fragmentState._fragmentRollbackAttributes(this.identifier);
  }

  _fragmentCommitWasRejected() {
    this.__cache.__fragmentState._fragmentCommitWasRejected(this.identifier);
  }

  _fragmentUnloadRecord() {
    this.__cache.__fragmentState._fragmentUnloadRecord(this.identifier);
  }

  notifyStateChange(key) {
    this.__cache.__storeWrapper.notifyChange(
      this.identifier,
      'attributes',
      key,
    );
  }

  fragmentDidDirty() {
    this.__cache.__fragmentState._fragmentDidDirty(this.identifier);
  }

  fragmentDidReset() {
    this.__cache.__fragmentState._fragmentDidReset(this.identifier);
  }
}
