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
    __cache: FragmentCache;
    identifier: FragmentIdentifier;
    constructor(cache: FragmentCache, identifier: FragmentIdentifier);
    get modelName(): string;
    get id(): string | null;
    get clientId(): string;
    get storeWrapper(): any;
    getFragment(key: string): any;
    hasFragment(key: string): boolean;
    setDirtyFragment(key: string, value: any): any;
    isFragmentDirty(key: string): boolean;
    getFragmentOwner(): FragmentRecordDataProxy | null;
    setFragmentOwner(ownerRecordData: any, key: string): any;
    _newFragmentRecordDataForKey(key: string, attributes: any): FragmentRecordDataProxy;
    _newFragmentRecordData(definition: any, attributes: any): FragmentRecordDataProxy;
    get _fragmentArrayCache(): any;
    rollbackFragment(key: string): any;
    hasChangedFragments(): boolean;
    changedFragments(): any;
    hasChangedAttributes(): boolean;
    changedAttributes(): any;
    getCanonicalState(): Record<string, unknown>;
    getCurrentState(): Record<string, unknown>;
    setDirtyAttribute(key: string, value: any): any;
    getAttr(key: string): any;
    rollbackAttributes(): any;
    isEmpty(): boolean;
    isNew(): boolean;
    isDeleted(): boolean;
    _fragmentGetRecord(properties?: any): any;
    _fragmentPushData(data: any): void;
    _fragmentWillCommit(): void;
    _fragmentDidCommit(data: any): void;
    _fragmentRollbackAttributes(): void;
    _fragmentCommitWasRejected(): void;
    _fragmentUnloadRecord(): void;
    notifyStateChange(key?: string): void;
    fragmentDidDirty(): void;
    fragmentDidReset(): void;
}
//# sourceMappingURL=fragment-record-data-proxy.d.ts.map