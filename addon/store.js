import { assert } from '@ember/debug';
import Store from 'ember-data/store';
import {
  macroCondition,
  dependencySatisfies,
  importSync,
} from '@embroider/macros';
import FragmentCache from './cache/fragment-cache';
import { default as Fragment } from './fragment';

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
      const FragmentSchemaService = importSync('./schema-service').default;
      return new FragmentSchemaService(this);
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
    // Get the record instance
    return this._instanceCache.getRecord(identifier, props);
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
