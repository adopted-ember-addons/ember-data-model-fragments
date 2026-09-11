import type { FragmentIdentifier, FragmentOwnerInfo } from '../-private/types.ts';
/**
 * Behavior for single fragment attributes
 */
declare class FragmentBehavior {
    stateManager: FragmentStateManager;
    identifier: FragmentIdentifier;
    definition: any;
    constructor(stateManager: FragmentStateManager, identifier: FragmentIdentifier, definition: any);
    getDefaultValue(key: string): any;
    pushData(fragment: any, canonical: any): any;
    willCommit(fragment: any): void;
    didCommit(fragment: any, canonical: any): any;
    commitWasRejected(fragment: any): void;
    rollback(fragment: any): void;
    unload(fragment: any): void;
    isDirty(value: any, originalValue: any): boolean;
    currentState(fragment: any): any;
    canonicalState(fragment: any): any;
}
/**
 * Behavior for fragment array attributes
 */
declare class FragmentArrayBehavior {
    stateManager: FragmentStateManager;
    identifier: FragmentIdentifier;
    definition: any;
    constructor(stateManager: FragmentStateManager, identifier: FragmentIdentifier, definition: any);
    getDefaultValue(key: string): any;
    pushData(fragmentArray: any, canonical: any): any;
    willCommit(fragmentArray: any): void;
    didCommit(fragmentArray: any, canonical: any): any;
    commitWasRejected(fragmentArray: any): void;
    rollback(fragmentArray: any): void;
    unload(fragmentArray: any): void;
    isDirty(value: any, originalValue: any): boolean;
    currentState(fragmentArray: any): any;
    canonicalState(fragmentArray: any): any;
}
/**
 * Behavior for plain array attributes
 */
declare class ArrayBehavior {
    stateManager: FragmentStateManager;
    identifier: FragmentIdentifier;
    definition: any;
    constructor(stateManager: FragmentStateManager, identifier: FragmentIdentifier, definition: any);
    getDefaultValue(key: string): any;
    pushData(array: any, canonical: any): any;
    willCommit(): void;
    didCommit(array: any, canonical: any): any;
    commitWasRejected(): void;
    rollback(): void;
    unload(): void;
    isDirty(value: any, originalValue: any): boolean;
    currentState(array: any): any;
    canonicalState(array: any): any;
}
type Behavior = FragmentBehavior | FragmentArrayBehavior | ArrayBehavior;
/**
 * FragmentStateManager manages fragment-specific state keyed by identifier.
 * It replaces the per-resource FragmentRecordData with a centralized state store.
 */
export default class FragmentStateManager {
    __storeWrapper: any;
    __fragmentData: Map<string, Record<string, any>>;
    __fragments: Map<string, Record<string, any> | null>;
    __inFlightFragments: Map<string, Record<string, any> | null>;
    __fragmentOwners: Map<string, FragmentOwnerInfo>;
    __fragmentArrayCache: Map<string, Record<string, any>>;
    __behaviors: Map<string, Record<string, Behavior>>;
    __committedFragments: Set<string>;
    __inFlightAttrValues: Map<string, Record<string, any>>;
    constructor(storeWrapper: any);
    get store(): any;
    get cache(): any;
    get innerCache(): any;
    _identifierFor(fragmentOrRecord: any): FragmentIdentifier;
    _getRecord(identifier: FragmentIdentifier, properties?: any): any;
    _getBehaviors(identifier: FragmentIdentifier): Record<string, Behavior>;
    _getFragmentDataMap(identifier: FragmentIdentifier): Record<string, any>;
    _getFragmentsMap(identifier: FragmentIdentifier): Record<string, any>;
    _getInFlightFragmentsMap(identifier: FragmentIdentifier): Record<string, any>;
    _getFragmentArrayCacheMap(identifier: FragmentIdentifier): Record<string, any>;
    _getFragmentDefault(identifier: FragmentIdentifier, key: string): any;
    getFragment(identifier: FragmentIdentifier, key: string): any;
    hasFragment(identifier: FragmentIdentifier, key: string): boolean | undefined;
    setDirtyFragment(identifier: FragmentIdentifier, key: string, value: any): void;
    isFragmentDirty(identifier: FragmentIdentifier, key: string): boolean;
    getFragmentOwner(identifier: FragmentIdentifier): FragmentOwnerInfo | undefined;
    setFragmentOwner(fragmentIdentifier: FragmentIdentifier, ownerIdentifier: FragmentIdentifier, key: string): void;
    /**
     * Returns true if the given attribute value is, or contains, an instantiated
     * Fragment. Used by FragmentCache.clientDidCreate to route fragment-instance
     * initialization (from `store.createRecord(type, { key: fragmentInstance })`)
     * through the adopt-fragment path instead of pushFragmentData (which only
     * accepts raw object/null canonical data).
     */
    valueContainsFragmentInstance(value: any): boolean;
    /**
     * Adopt an existing fragment instance (or array of fragment instances) for the
     * given owner identifier + key. This is used by the client-created path
     * (`createRecord(...props)`) when consumers pass already-instantiated
     * fragments rather than raw object data.
     *
     * Returns the canonical fragment identifier value to be stored in the
     * fragment data map (a single identifier for `fragment` kind, an array of
     * identifiers for `fragment-array` kind).
     *
     * Asserts when the provided value does not match the fragment kind/type
     * declared on the owner's schema.
     */
    adoptFragmentForKey(ownerIdentifier: FragmentIdentifier, key: string, value: any): any;
    /**
     * Set canonical fragment data for a key on an owner identifier. Used by the
     * client-created path after adopting fragment instances so subsequent
     * getFragment/getCurrentState calls find the canonical value without going
     * through pushData (which only accepts raw object/null canonical data).
     */
    setCanonicalFragmentValue(identifier: FragmentIdentifier, key: string, value: any): void;
    _newFragmentIdentifierForKey(identifier: FragmentIdentifier, key: string, attributes: any): FragmentIdentifier;
    _newFragmentIdentifier(ownerIdentifier: FragmentIdentifier, definition: any, attributes: any): FragmentIdentifier;
    hasChangedAttributes(identifier: FragmentIdentifier): boolean;
    hasChangedFragments(identifier: FragmentIdentifier): boolean;
    getCanonicalState(identifier: FragmentIdentifier): Record<string, any>;
    getCurrentState(identifier: FragmentIdentifier): Record<string, any>;
    changedFragments(identifier: FragmentIdentifier): Record<string, any>;
    _changedFragmentKeys(identifier: FragmentIdentifier, updates: Record<string, any>): string[];
    pushFragmentData(identifier: FragmentIdentifier, data: any, calculateChange: boolean, shouldNotify?: boolean): string[];
    willCommitFragments(identifier: FragmentIdentifier): void;
    _updateChangedFragments(identifier: FragmentIdentifier): void;
    didCommitFragments(identifier: FragmentIdentifier, data: any): string[];
    commitWasRejectedFragments(identifier: FragmentIdentifier): void;
    rollbackFragments(identifier: FragmentIdentifier): string[];
    rollbackFragment(identifier: FragmentIdentifier, key: string): void;
    unloadFragments(identifier: FragmentIdentifier): void;
    _fragmentDidDirty(identifier: FragmentIdentifier): void;
    _fragmentDidReset(identifier: FragmentIdentifier): void;
    _notifyStateChange(identifier: FragmentIdentifier, key?: string): void;
    _fragmentPushData(identifier: FragmentIdentifier, data: any): void;
    _fragmentWillCommit(identifier: FragmentIdentifier): void;
    _fragmentDidCommit(identifier: FragmentIdentifier, data: any): void;
    /**
     * Check if a fragment has been committed (is no longer new)
     */
    isFragmentCommitted(identifier: FragmentIdentifier): boolean;
    _fragmentRollbackAttributes(identifier: FragmentIdentifier): void;
    _fragmentCommitWasRejected(identifier: FragmentIdentifier): void;
    _fragmentUnloadRecord(identifier: FragmentIdentifier): void;
}
export {};
//# sourceMappingURL=fragment-state-manager.d.ts.map