import FragmentRecordDataProxy from './fragment-record-data-proxy.ts';
import type { FragmentIdentifier, FragmentOwnerInfo } from '../-private/types.ts';
/**
 * FragmentCache wraps the default JSONAPICache and adds fragment-specific
 * state management. It implements the V2 Cache interface.
 *
 * This is a singleton cache that handles ALL resources - both regular models
 * and fragments.
 */
export default class FragmentCache {
    version: string;
    __storeWrapper: any;
    __innerCache: any;
    __fragmentState: any;
    __recordDataProxies: Map<string, FragmentRecordDataProxy>;
    __storeValidated: boolean;
    constructor(storeWrapper: any);
    get store(): any;
    /**
     * Validates that the store service extends FragmentStore
     * This validation is lazy - only checked when fragment functionality is first needed
     */
    _validateStore(): void;
    /**
     * Get or create a FragmentRecordDataProxy for the given identifier.
     * This provides backwards compatibility with code expecting per-resource RecordData API.
     */
    createFragmentRecordData(identifier: FragmentIdentifier): FragmentRecordDataProxy;
    getFragment(identifier: FragmentIdentifier, key: string): any;
    hasFragment(identifier: FragmentIdentifier, key: string): boolean;
    setDirtyFragment(identifier: FragmentIdentifier, key: string, value: any): any;
    isFragmentDirty(identifier: FragmentIdentifier, key: string): boolean;
    getFragmentOwner(identifier: FragmentIdentifier): FragmentOwnerInfo | null | undefined;
    setFragmentOwner(fragmentIdentifier: FragmentIdentifier, ownerIdentifier: FragmentIdentifier, key: string): any;
    newFragmentIdentifierForKey(identifier: FragmentIdentifier, key: string, attributes: any): any;
    getFragmentArrayCache(identifier: FragmentIdentifier, key: string): any;
    setFragmentArrayCache(identifier: FragmentIdentifier, key: string, value: any): void;
    rollbackFragment(identifier: FragmentIdentifier, key: string): any;
    hasChangedFragments(identifier: FragmentIdentifier): boolean;
    changedFragments(identifier: FragmentIdentifier): any;
    getFragmentCanonicalState(identifier: FragmentIdentifier): any;
    getFragmentCurrentState(identifier: FragmentIdentifier): any;
    /**
     * Cache the response to a request.
     *
     * In ember-data 4.13+, this is the primary entry point for caching data.
     * We intercept to extract fragment attributes before passing to the inner cache.
     *
     * The document structure is:
     * {
     *   request: {...},
     *   response: {...},
     *   content: {
     *     data: { type, id, attributes, relationships } | [...],
     *     included: [...],
     *     meta: {...}
     *   }
     * }
     */
    put(doc: any): any;
    /**
     * Collect fragment attributes from a JSON:API document WITHOUT creating fragment identifiers.
     * This just stores the raw fragment data and removes fragment attributes from resources.
     * Fragment identifiers will be created later after owner records are in the cache.
     *
     * @private
     */
    _collectFragmentsFromDocument(jsonApiDoc: any, fragmentDataByIdentifier: Map<any, any>): void;
    /**
     * Collect fragment attributes from a single resource WITHOUT creating fragment identifiers.
     *
     * @private
     */
    _collectFragmentsFromResource(resource: any, fragmentDataByIdentifier: Map<any, any>): void;
    /**
     * Update the "remote" or "canonical" state via a merge operation
     */
    patch(op: any): any;
    /**
     * Update the "local" or "current" (unpersisted) state
     */
    mutate(mutation: any): any;
    /**
     * Peek resource data from the Cache
     */
    peek(identifier: FragmentIdentifier): any;
    peekRemoteState(identifier: FragmentIdentifier): any;
    /**
     * Peek the Cache for existing request data
     */
    peekRequest(identifier: any): any;
    /**
     * Push resource data from a remote source into the cache.
     * Intercepts to handle fragment attributes.
     *
     * In ember-data 4.13+, the signature is:
     *   upsert(identifier, resource, hasRecord) where resource is the JSON:API resource object
     * In ember-data 4.12, the signature was:
     *   upsert(identifier, data, calculateChanges) where data = { attributes: {...} }
     */
    upsert(identifier: FragmentIdentifier, data: any, hasRecordOrCalculateChanges?: boolean): any;
    /**
     * Signal to the cache that a new record has been instantiated on the client
     */
    clientDidCreate(identifier: FragmentIdentifier, options?: any): any;
    /**
     * Signals to the cache that a resource will be part of a save transaction
     */
    willCommit(identifier: FragmentIdentifier): any;
    /**
     * Signals to the cache that a resource was successfully updated
     */
    didCommit(identifier: FragmentIdentifier, data: any): any;
    /**
     * Signals to the cache that a resource save transaction failed
     */
    commitWasRejected(identifier: FragmentIdentifier, errors?: any): any;
    /**
     * Signals to the cache that all data for a resource should be cleared
     */
    unloadRecord(identifier: FragmentIdentifier): any;
    /**
     * Retrieve the data for an attribute from the cache
     */
    getAttr(identifier: FragmentIdentifier, attr: string): any;
    /**
     * Mutate the data for an attribute in the cache
     */
    setAttr(identifier: FragmentIdentifier, attr: string, value: any): any;
    /**
     * Query the cache for the changed attributes of a resource
     */
    changedAttrs(identifier: FragmentIdentifier): any;
    /**
     * Query the cache for whether any mutated attributes exist
     */
    hasChangedAttrs(identifier: FragmentIdentifier): boolean;
    /**
     * Tell the cache to discard any uncommitted mutations to attributes
     */
    rollbackAttrs(identifier: FragmentIdentifier): string[];
    /**
     * Query the cache for the current state of a relationship
     */
    getRelationship(identifier: FragmentIdentifier, field: string): any;
    getRemoteRelationship(identifier: FragmentIdentifier, field: string): any;
    changedRelationships(identifier: FragmentIdentifier): any;
    hasChangedRelationships(identifier: FragmentIdentifier): boolean;
    rollbackRelationships(identifier: FragmentIdentifier): any;
    /**
     * Update the cache state for the given resource to be marked as locally deleted
     */
    setIsDeleted(identifier: FragmentIdentifier, isDeleted: boolean): any;
    /**
     * Query the cache for any validation errors applicable to the given resource
     */
    getErrors(identifier: FragmentIdentifier): any;
    getRemoteAttr(identifier: FragmentIdentifier, attr: string): any;
    /**
     * Query the cache for whether a given resource has any available data
     */
    isEmpty(identifier: FragmentIdentifier): boolean;
    /**
     * Query the cache for whether a given resource was created locally
     */
    isNew(identifier: FragmentIdentifier): boolean;
    /**
     * Query the cache for whether a given resource is marked as deleted
     */
    isDeleted(identifier: FragmentIdentifier): boolean;
    /**
     * Query the cache for whether a given resource has been deleted and persisted
     */
    isDeletionCommitted(identifier: FragmentIdentifier): boolean;
    fork(): any;
    merge(cache: any): any;
    diff(): any;
    dump(): any;
    hydrate(stream: any): any;
}
//# sourceMappingURL=fragment-cache.d.ts.map