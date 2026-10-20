import Transform from '@ember-data/serializer/transform';
import { service } from '@ember/service';
import { recordIdentifierFor } from '@ember-data/store';
import type Store from '@ember-data/store';
import {
  leaveUnnormalized,
  normalizeFragmentData,
} from '../util/fragment-data.ts';
import { payloadKeyFor } from '../serializers/utils.ts';

/**
  @module ember-data-model-fragments
*/

/**
  The public shape of `FragmentTransform`. The runtime class is built with
  `Transform.extend()` (see below), so the type surface is declared here for
  consumers — the inferred `.extend()` type cannot be emitted in declarations.
*/
// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare class FragmentTransformClass extends Transform {
  store: Store;
  type: string | null;
  polymorphicTypeProp: string | null;
  deserialize(data: any, options?: any, parentData?: any): any;
  serialize(snapshot: any): any;
  /**
    The model name for a fragment's payload data, from a string `typeKey`.
    A function `typeKey` isn't resolved here: it's called with the owner
    record, so the cache resolves it.
  */
  modelNameFor(data: any, options?: any, parentData?: any): string | null;
  deserializeSingle(data: any, options?: any, parentData?: any): any;
}

// The type under a string `typeKey` in a fragment's payload data, which may
// use the declared type's serializer key for it
function payloadType(transform: any, data: any): string | undefined {
  const typeKey = transform.polymorphicTypeProp;

  if (!data || !typeKey) {
    return undefined;
  }

  if (data[typeKey] !== undefined) {
    return data[typeKey];
  }

  const serializer = transform.store.serializerFor(transform.type);
  return data[payloadKeyFor(serializer, typeKey, data)];
}

/**
  Transform for `MF.fragment` fragment attribute which delegates work to
  the fragment type's serializer

  @class FragmentTransform
  @namespace MF
  @extends DS.Transform
*/
// eslint-disable-next-line ember/no-classic-classes
const FragmentTransform = Transform.extend({
  store: service('store') as unknown as Store,
  type: null as string | null,
  polymorphicTypeProp: null as string | null,

  deserialize: function deserializeFragment(
    this: any,
    data: any,
    options: any,
    parentData: any,
  ) {
    if (data == null) {
      return null;
    }

    return this.deserializeSingle(data, options, parentData);
  },

  serialize: function serializeFragment(this: any, snapshot: any) {
    if (!snapshot) {
      return null;
    }

    const store = this.store;

    // In ember-data 4.12+, fragment attributes in Snapshot._attributes may be:
    // 1. A Fragment instance (has _createSnapshot method)
    // 2. A Snapshot (has eachAttribute method) - from ext.js patch
    // 3. Raw data object (plain Object) - when cache returns raw data

    if (typeof snapshot._createSnapshot === 'function') {
      // It's a Fragment instance - create snapshot and serialize
      const realSnapshot = snapshot._createSnapshot();
      const identifier = recordIdentifierFor(snapshot);
      const modelName = identifier.type;
      const serializer = store.serializerFor(modelName);
      return serializer.serialize(realSnapshot);
    }

    if (typeof snapshot.eachAttribute === 'function') {
      // It's already a Snapshot - serialize directly
      const modelName =
        snapshot.modelName || snapshot.identifier?.type || this.type;
      const serializer = store.serializerFor(modelName);
      return serializer.serialize(snapshot);
    }

    // It's raw data (plain object) - return as-is
    // This happens in ember-data 4.12+ where fragment data is stored as plain objects
    return snapshot;
  },

  modelNameFor(this: any, data: any) {
    return payloadType(this, data) || this.type;
  },

  deserializeSingle(this: any, data: any, options: any, parentData: any) {
    // A function `typeKey` is called with the owner record, which may not
    // exist yet, so the cache normalizes this once it does
    if (options?.polymorphic && typeof options.typeKey === 'function') {
      return leaveUnnormalized(data);
    }

    const modelName = this.modelNameFor(data, options, parentData);
    const attributes = normalizeFragmentData(this.store, modelName, data);
    const type = payloadType(this, data);

    // The cache reads the type from here (`getActualFragmentType`) when it
    // creates the fragment, and the fragment class doesn't have to declare it
    if (attributes && type !== undefined) {
      attributes[this.polymorphicTypeProp] ??= type;
    }

    return attributes;
  },
}) as unknown as typeof FragmentTransformClass;

export default FragmentTransform;
