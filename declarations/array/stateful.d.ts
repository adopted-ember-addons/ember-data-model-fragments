import EmberObject from '@ember/object';
import MutableArray from '@ember/array/mutable';
import type FragmentCache from '../cache/fragment-cache.ts';
import type { FragmentIdentifier } from '../-private/types.ts';
/**
  @module ember-data-model-fragments
*/
/**
  The public shape of `StatefulArray`. The runtime class is built with
  `EmberObject.extend()` (see below), so the type surface is declared here
  for consumers.
*/
export interface StatefulArray<T = unknown> extends EmberObject, MutableArray<T> {
    /**
      A reference to the array's owner record.
  
      @property owner
      @type {DS.Model}
    */
    readonly owner: unknown;
    /**
      The identifier of the owner record.
  
      @property identifier
      @private
      @type {StableRecordIdentifier}
    */
    identifier: FragmentIdentifier;
    /**
      The array's property name on the owner record.
  
      @property key
      @private
      @type {String}
    */
    key: string;
    /**
      Reference to the store
  
      @property store
      @private
      @type {Store}
    */
    store: any;
    /**
      Get the cache from the store
  
      @property cache
      @private
    */
    readonly cache: FragmentCache;
    /** @private */
    currentState: T[];
    /**
      If this property is `true` the contents of the array do not match its
      original state. The array has local changes that have not yet been saved
      by the adapter. This includes additions, removals, and reordering of
      elements.
  
      @property hasDirtyAttributes
      @type {Boolean}
      @readOnly
    */
    readonly hasDirtyAttributes: boolean;
    /**
      This method reverts local changes of the array's contents to its original
      state.
  
      @method rollbackAttributes
    */
    rollbackAttributes(): void;
    /**
      Method alias for `toArray`.
  
      @method serialize
      @return {Array}
    */
    serialize(): unknown[];
    /**
      Copies the array by calling copy on each of its members.
  
      @method copy
      @return {array} a new array
    */
    copy(): unknown[];
    toStringExtension(): string;
    /** @private */
    _setFragments(objects: T[]): void;
    /** @private */
    _createSnapshot(): unknown;
    /** @private */
    notify(): void;
    /** @private */
    retrieveLatest(): void;
}
/** The class side of `StatefulArray`. */
export interface StatefulArrayClass<Instance = StatefulArray> {
    create(props?: Record<string, unknown>): Instance;
    extend(...definitions: object[]): StatefulArrayClass<Instance>;
    new (...args: any[]): Instance;
    readonly prototype: Instance;
}
declare const StatefulArray: StatefulArrayClass;
export default StatefulArray;
//# sourceMappingURL=stateful.d.ts.map