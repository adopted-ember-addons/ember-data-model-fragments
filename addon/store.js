import { assert } from '@ember/debug';
import { getOwner } from '@ember/application';
import Store from 'ember-data/store';
import {
  macroCondition,
  dependencySatisfies,
  importSync,
} from '@embroider/macros';
import FragmentCache from './cache/fragment-cache';
import { default as Fragment } from './fragment';
import { installCacheManagerCompat } from './util/fragment-cache';

// Import side-effects to ensure monkey-patches are applied
// These must be imported before any store instances are created
import './ext'; // Applies Snapshot monkey-patch for fragment serialization

/**
  FragmentStore is the base store class for ember-data-model-fragments.
  
  To use this addon, you must create an application store service that extends FragmentStore:
  
  ```js
  // app/services/store.js
  import FragmentStore from 'ember-data-model-fragments/store';
  
  export default class extends FragmentStore {}
  ```

  Your application serializer should also extend one of the fragment-aware serializers:

  ```js
  // app/serializers/application.js
  import FragmentSerializer from 'ember-data-model-fragments/serializer';
  
  export default class extends FragmentSerializer {}
  ```

  @class FragmentStore
  @extends Store
  @public
*/
export default class FragmentStore extends Store {
  get cache() {
    return installCacheManagerCompat(this, super.cache);
  }

  /**
   * Override createCache to return our FragmentCache
   * This is the V2 Cache hook introduced in ember-data 4.7+
   *
   * @method createCache
   * @param {Object} storeWrapper
   * @return {FragmentCache}
   * @public
   */
  createCache(storeWrapper) {
    return new FragmentCache(storeWrapper);
  }

  /**
   * Override createSchemaService to provide fragment-aware schema for ember-data 4.13+
   *
   * In ember-data 4.13, a new schema service architecture was introduced that only
   * recognizes attributes with `kind: 'attribute'`. Fragment attributes use different
   * kinds ('fragment', 'fragment-array', 'array'), so they need special handling.
   *
   * This method is only called in ember-data 4.13+. For ember-data 4.12, this method
   * doesn't exist in the Store class, so it's never invoked.
   *
   * The `macroCondition` ensures build-time optimization:
   * - For 4.12 builds: This code is completely removed (tree-shaking)
   * - For 4.13 builds: Only the FragmentSchemaService path remains
   *
   * @method createSchemaService
   * @return {FragmentSchemaService|undefined}
   * @public
   */
  createSchemaService() {
    if (macroCondition(dependencySatisfies('ember-data', '>=4.13.0-alpha.0'))) {
      const { buildSchema } = importSync('@ember-data/model/hooks');

      const FragmentSchemaService = importSync('./schema-service').default;

      return new FragmentSchemaService(this, buildSchema(this));
    }
    // For ember-data 4.12, this method is never called (doesn't exist in Store base class)
    return undefined;
  }

  /**
   * Override teardownRecord to handle fragments in a disconnected state.
   * In ember-data 4.12+, fragments can end up disconnected during unload,
   * and the default teardownRecord fails when trying to destroy them.
   *
   * @method teardownRecord
   * @param {Model} record
   * @public
   */
  teardownRecord(record) {
    // Check if record is a fragment (by checking if it has no id or by model type)
    // We need to handle the case where the fragment's store is disconnected
    if (record.isDestroyed || record.isDestroying) {
      return;
    }
    try {
      record.destroy();
    } catch (e) {
      // If the error is about disconnected state, just let it go
      // The fragment will be cleaned up by ember's garbage collection
      if (
        e?.message?.includes?.('disconnected state') ||
        e?.message?.includes?.('cannot utilize the store')
      ) {
        return;
      }
      throw e;
    }
  }

  /**
    Create a new fragment that does not yet have an owner record.
    The properties passed to this method are set on the newly created
    fragment.

    To create a new instance of the `name` fragment:

    ```js
    store.createFragment('name', {
      first: 'Alex',
      last: 'Routé'
    });
    ```

    @method createFragment
    @param {String} modelName - The type of fragment to create
    @param {Object} props - A hash of properties to set on the newly created fragment
    @return {Fragment} fragment
    @public
  */
  createFragment(modelName, props) {
    assert(
      `The '${modelName}' model must be a subclass of MF.Fragment`,
      this.isFragment(modelName),
    );
    // Create a new identifier for the fragment
    const identifier = this.identifierCache.createIdentifierForNewRecord({
      type: modelName,
    });
    // Signal to cache that this is a new record
    this.cache.clientDidCreate(identifier, props || {});
    if (macroCondition(dependencySatisfies('ember-data', '>=5.8.0'))) {
      const record = this._instanceCache.getRecord(identifier);

      if (props) {
        const definitions =
          this.getSchemaDefinitionService().fields(identifier);

        for (const [key, value] of Object.entries(props)) {
          if (!definitions.has(key)) {
            record.set(key, value);
          }
        }
      }

      return record;
    }

    // Get the record instance
    return this._instanceCache.getRecord(identifier, props);
  }

  /**
    Override `serializerFor` so fragment models never fall back to
    `serializer:application`.

    Why: a typical app's `serializer:application` is a REST or JSON:API
    serializer that does not know how to normalize a raw fragment hash. In
    particular, a JSON:API application serializer would trip the assert in
    `FragmentTransform.deserializeSingle` and break fragment deserialization
    on ember-data 4.12 (and any other path that runs the fragment transform
    pipeline).

    Resolution order for fragment model names:
      1. `serializer:{modelName}` (if the app registered a per-fragment serializer)
      2. `serializer:-fragment` (consumer-overridable global fragment serializer)
      3. `serializer:-mf-fragment` (lazily-registered default `FragmentSerializer`,
         which extends `JSONSerializer` and is what the fragment pipeline expects)

    Non-fragment lookups defer to the parent `serializerFor`, preserving normal
    app behavior (including `serializer:application` fallback).

    Implementation note: in ember-data 5.x, `serializerFor` is defined on the
    parent `Store` as a class-field arrow function, which is assigned per
    instance during the parent constructor and would shadow any prototype-level
    override declared on this subclass. To handle both shapes (class field on
    5.x, prototype method on 4.12) we install the override in the constructor,
    which runs after the parent constructor and therefore wins in either case.
    The original `serializerFor` is captured and used for non-fragment lookups.

    This restores the pre-4.13 behavior that was lost when the previous
    `Store.reopen({ serializerFor })` from `addon/ext.js` was removed.

    @method serializerFor
    @param {String} modelName
    @return {Serializer}
    @public
  */
  constructor(...args) {
    super(...args);

    const parentSerializerFor =
      typeof this.serializerFor === 'function'
        ? this.serializerFor.bind(this)
        : null;

    this.serializerFor = (modelName) => {
      if (typeof modelName === 'string' && this._isFragmentSafe(modelName)) {
        return this._fragmentSerializerFor(modelName);
      }
      if (parentSerializerFor) {
        return parentSerializerFor(modelName);
      }
      return null;
    };
  }

  /**
    Resolve a serializer for a fragment model name.

    @private
  */
  _fragmentSerializerFor(modelName) {
    const owner = getOwner(this);

    // 1. Per-fragment-type serializer (e.g. app/serializers/name.js).
    //    We must check `hasRegistration`/`factoryFor` rather than relying on
    //    `lookup` returning undefined, because in some ember-data versions
    //    `owner.lookup('serializer:<unknown>')` is routed through a resolver
    //    that auto-falls-back to `serializer:application`.
    const perTypeKey = `serializer:${modelName}`;
    if (
      owner.hasRegistration(perTypeKey) ||
      owner.factoryFor(perTypeKey) !== undefined
    ) {
      return owner.lookup(perTypeKey);
    }

    // 2. Consumer-provided global fragment serializer.
    const GLOBAL_KEY = 'serializer:-fragment';
    if (
      owner.hasRegistration(GLOBAL_KEY) ||
      owner.factoryFor(GLOBAL_KEY) !== undefined
    ) {
      return owner.lookup(GLOBAL_KEY);
    }

    // 3. Lazily register and return our default FragmentSerializer.
    //    This is JSON-based (not REST/JSON:API), which is what the fragment
    //    pipeline expects.
    const FALLBACK_KEY = 'serializer:-mf-fragment';
    if (!owner.hasRegistration(FALLBACK_KEY)) {
      const FragmentSerializer = importSync('./serializers/fragment').default;
      owner.register(FALLBACK_KEY, FragmentSerializer);
    }
    return owner.lookup(FALLBACK_KEY);
  }

  /**
    Like `isFragment`, but never throws for unknown model names. `serializerFor`
    is called with synthetic names (e.g. `-default`, `application`, transform
    types, etc.) so we can't let `modelFor` blow up.

    @private
  */
  _isFragmentSafe(modelName) {
    if (
      !modelName ||
      modelName === 'application' ||
      modelName === '-default' ||
      modelName.charAt(0) === '-'
    ) {
      return false;
    }
    try {
      return this.isFragment(modelName);
    } catch {
      return false;
    }
  }

  /**
    Returns true if the modelName is a fragment, false if not

    @method isFragment
    @param {String} modelName - The modelName to check if a fragment
    @return {Boolean}
    @public
  */
  isFragment(modelName) {
    if (modelName === 'application' || modelName === '-default') {
      return false;
    }

    const type = this.modelFor(modelName);
    return Fragment.detect(type);
  }
}
