import type FragmentCache from './fragment-cache.ts';
import type { FragmentIdentifier } from '../-private/types.ts';

/**
 * FragmentRecordDataProxy provides a backwards-compatible per-resource API
 * for code that expects a RecordData instance per record/fragment.
 *
 * This is a thin wrapper that delegates to the singleton FragmentCache
 * with the appropriate identifier.
 */
export default class FragmentRecordDataProxy {
  declare __cache: FragmentCache;
  declare identifier: FragmentIdentifier;

  constructor(cache: FragmentCache, identifier: FragmentIdentifier) {
    this.__cache = cache;
    this.identifier = identifier;
  }

  get modelName(): string {
    return this.identifier.type;
  }

  get id(): string | null {
    return this.identifier.id;
  }

  get clientId(): string {
    return this.identifier.lid;
  }

  get storeWrapper(): any {
    return (this.__cache as any).__storeWrapper;
  }

  // Fragment-specific methods
  getFragment(key: string): any {
    return this.__cache.getFragment(this.identifier, key);
  }

  hasFragment(key: string): boolean {
    return this.__cache.hasFragment(this.identifier, key);
  }

  setDirtyFragment(key: string, value: any): any {
    return this.__cache.setDirtyFragment(this.identifier, key, value);
  }

  isFragmentDirty(key: string): boolean {
    return this.__cache.isFragmentDirty(this.identifier, key);
  }

  getFragmentOwner(): FragmentRecordDataProxy | null {
    const owner = this.__cache.getFragmentOwner(this.identifier);
    if (!owner) {
      return null;
    }
    // Return a proxy for the owner for backwards compatibility
    return this.__cache.createFragmentRecordData(owner.ownerIdentifier);
  }

  setFragmentOwner(ownerRecordData: any, key: string): any {
    const ownerIdentifier = ownerRecordData.identifier || ownerRecordData;
    return this.__cache.setFragmentOwner(this.identifier, ownerIdentifier, key);
  }

  _newFragmentRecordDataForKey(
    key: string,
    attributes: any,
  ): FragmentRecordDataProxy {
    const fragmentIdentifier = this.__cache.newFragmentIdentifierForKey(
      this.identifier,
      key,
      attributes,
    );
    return this.__cache.createFragmentRecordData(fragmentIdentifier);
  }

  _newFragmentRecordData(
    definition: any,
    attributes: any,
  ): FragmentRecordDataProxy {
    // This is called with a definition object, not a key
    // We need to delegate to the fragment state manager
    const fragmentIdentifier = (
      this.__cache as any
    ).__fragmentState._newFragmentIdentifier(
      this.identifier,
      definition,
      attributes,
    );
    return this.__cache.createFragmentRecordData(fragmentIdentifier);
  }

  get _fragmentArrayCache(): any {
    return (this.__cache as any).__fragmentState._getFragmentArrayCacheMap(
      this.identifier,
    );
  }

  rollbackFragment(key: string): any {
    return this.__cache.rollbackFragment(this.identifier, key);
  }

  hasChangedFragments(): boolean {
    return this.__cache.hasChangedFragments(this.identifier);
  }

  changedFragments(): any {
    return this.__cache.changedFragments(this.identifier);
  }

  // Standard RecordData-like methods
  hasChangedAttributes(): boolean {
    return this.__cache.hasChangedAttrs(this.identifier);
  }

  changedAttributes(): any {
    return this.__cache.changedAttrs(this.identifier);
  }

  getCanonicalState(): Record<string, unknown> {
    // Get both regular attrs and fragment canonical state
    const fragmentState = this.__cache.getFragmentCanonicalState(
      this.identifier,
    );
    const regularState = (this.__cache as any).peek(this.identifier);
    return Object.assign({}, regularState?.attributes || {}, fragmentState);
  }

  getCurrentState(): Record<string, unknown> {
    // Get both regular attrs and fragment current state
    const fragmentState = this.__cache.getFragmentCurrentState(this.identifier);
    const regularState: Record<string, unknown> = {};

    // Get regular attributes from cache
    const definitions = (this.__cache as any).__storeWrapper
      .getSchemaDefinitionService()
      .attributesDefinitionFor(this.identifier);
    for (const [key, definition] of Object.entries<any>(definitions)) {
      const isFragmentAttr =
        definition.isFragment || definition.options?.isFragment;
      if (!isFragmentAttr) {
        regularState[key] = this.__cache.getAttr(this.identifier, key);
      }
    }

    return Object.assign({}, regularState, fragmentState);
  }

  setDirtyAttribute(key: string, value: any): any {
    return this.__cache.setAttr(this.identifier, key, value);
  }

  getAttr(key: string): any {
    return this.__cache.getAttr(this.identifier, key);
  }

  rollbackAttributes(): any {
    return (this.__cache as any).rollbackAttrs(this.identifier);
  }

  isEmpty(): boolean {
    return (this.__cache as any).isEmpty(this.identifier);
  }

  isNew(): boolean {
    return this.__cache.isNew(this.identifier);
  }

  isDeleted(): boolean {
    return this.__cache.isDeleted(this.identifier);
  }

  // Methods for InternalModel compatibility
  _fragmentGetRecord(properties?: any): any {
    return (this.__cache as any).__fragmentState._getRecord(
      this.identifier,
      properties,
    );
  }

  _fragmentPushData(data: any): void {
    (this.__cache as any).__fragmentState._fragmentPushData(
      this.identifier,
      data,
    );
  }

  _fragmentWillCommit(): void {
    (this.__cache as any).__fragmentState._fragmentWillCommit(this.identifier);
  }

  _fragmentDidCommit(data: any): void {
    (this.__cache as any).__fragmentState._fragmentDidCommit(
      this.identifier,
      data,
    );
  }

  _fragmentRollbackAttributes(): void {
    (this.__cache as any).__fragmentState._fragmentRollbackAttributes(
      this.identifier,
    );
  }

  _fragmentCommitWasRejected(): void {
    (this.__cache as any).__fragmentState._fragmentCommitWasRejected(
      this.identifier,
    );
  }

  _fragmentUnloadRecord(): void {
    (this.__cache as any).__fragmentState._fragmentUnloadRecord(
      this.identifier,
    );
  }

  notifyStateChange(key?: string): void {
    (this.__cache as any).__storeWrapper.notifyChange(
      this.identifier,
      'attributes',
      key,
    );
  }

  fragmentDidDirty(): void {
    (this.__cache as any).__fragmentState._fragmentDidDirty(this.identifier);
  }

  fragmentDidReset(): void {
    (this.__cache as any).__fragmentState._fragmentDidReset(this.identifier);
  }
}
