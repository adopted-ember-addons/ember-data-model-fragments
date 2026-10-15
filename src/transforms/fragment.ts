import Transform from '@ember-data/serializer/transform';
import { service } from '@ember/service';
import { recordIdentifierFor } from '@ember-data/store';
import type Store from '@ember-data/store';

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
  modelNameFor(data: any, options?: any, parentData?: any): string | null;
  deserializeSingle(data: any, options?: any, parentData?: any): any;
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

  modelNameFor(this: any, data: any, options: any, parentData: any) {
    let modelName = this.type;
    const polymorphicTypeProp = this.polymorphicTypeProp;

    if (data && polymorphicTypeProp && data[polymorphicTypeProp]) {
      modelName = data[polymorphicTypeProp];
    } else if (options && typeof options.typeKey === 'function') {
      modelName = options.typeKey(data, parentData);
    }

    return modelName;
  },

  deserializeSingle(this: any, data: any, options: any, parentData: any) {
    const store = this.store;
    const modelName = this.modelNameFor(data, options, parentData);
    // `FragmentStore#serializerFor` guarantees a JSON-based serializer
    // (FragmentSerializer / JSONSerializer) for fragment model names, so we
    // do not need to defend against REST/JSON:API serializers here.
    const serializer = store.serializerFor(modelName);

    const typeClass = store.modelFor(modelName);
    const serialized = serializer.normalize(typeClass, data);

    // `JSONSerializer#normalize` returns a full JSON API document, but we only
    // need the attributes hash
    return serialized?.data?.attributes;
  },
}) as unknown as typeof FragmentTransformClass;

export default FragmentTransform;
