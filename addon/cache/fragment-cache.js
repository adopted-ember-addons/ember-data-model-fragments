import { assert } from '@ember/debug';
import JSONAPICache from '@ember-data/json-api';
import FragmentStateManager from './fragment-state-manager';
import FragmentRecordDataProxy from './fragment-record-data-proxy';

/**
 * FragmentCache wraps the default JSONAPICache and adds fragment-specific
 * state management. It implements the V2 Cache interface.
 *
 * This is a singleton cache that handles ALL resources - both regular models
 * and fragments.
 */
export default class FragmentCache {
  version = '2';

  constructor(storeWrapper) {
    this.__storeWrapper = storeWrapper;
    this.__innerCache = new JSONAPICache(storeWrapper);
    this.__fragmentState = new FragmentStateManager(storeWrapper);
    this.__recordDataProxies = new Map();
    this.__storeValidated = false;
  }

  get store() {
    return this.__storeWrapper._store;
  }

  /**
   * Validates that the store service extends FragmentStore
   * This validation is lazy - only checked when fragment functionality is first needed
   */
  _validateStore() {
    if (this.__storeValidated) {
      return;
    }
    this.__storeValidated = true;

    const store = this.store;

    // Check if the store has the required fragment methods
    const hasFragmentMethods =
      typeof store.createFragment === 'function' &&
      typeof store.isFragment === 'function';

    assert(
      `ember-data-model-fragments requires your store service to extend FragmentStore.\n\n` +
        `Create app/services/store.js with the following:\n\n` +
        `import FragmentStore from 'ember-data-model-fragments/store';\n` +
        `export default class extends FragmentStore {}\n\n` +
        `See the ember-data-model-fragments documentation for more information.`,
      hasFragmentMethods,
    );
  }

  /**
   * Get or create a FragmentRecordDataProxy for the given identifier.
   * This provides backwards compatibility with code expecting per-resource RecordData API.
   */
  createFragmentRecordData(identifier) {
    let proxy = this.__recordDataProxies.get(identifier.lid);
    if (!proxy) {
      proxy = new FragmentRecordDataProxy(this, identifier);
      this.__recordDataProxies.set(identifier.lid, proxy);
    }
    return proxy;
  }

  // ==================
  // Fragment-specific public API
  // ==================

  getFragment(identifier, key) {
    this._validateStore();
    return this.__fragmentState.getFragment(identifier, key);
  }

  hasFragment(identifier, key) {
    return this.__fragmentState.hasFragment(identifier, key);
  }

  setDirtyFragment(identifier, key, value) {
    return this.__fragmentState.setDirtyFragment(identifier, key, value);
  }

  isFragmentDirty(identifier, key) {
    return this.__fragmentState.isFragmentDirty(identifier, key);
  }

  getFragmentOwner(identifier) {
    return this.__fragmentState.getFragmentOwner(identifier);
  }

  setFragmentOwner(fragmentIdentifier, ownerIdentifier, key) {
    return this.__fragmentState.setFragmentOwner(
      fragmentIdentifier,
      ownerIdentifier,
      key,
    );
  }

  newFragmentIdentifierForKey(identifier, key, attributes) {
    return this.__fragmentState._newFragmentIdentifierForKey(
      identifier,
      key,
      attributes,
    );
  }

  getFragmentArrayCache(identifier, key) {
    return this.__fragmentState._getFragmentArrayCacheMap(identifier)[key];
  }

  setFragmentArrayCache(identifier, key, value) {
    this.__fragmentState._getFragmentArrayCacheMap(identifier)[key] = value;
  }

  rollbackFragment(identifier, key) {
    return this.__fragmentState.rollbackFragment(identifier, key);
  }

  hasChangedFragments(identifier) {
    return this.__fragmentState.hasChangedFragments(identifier);
  }

  changedFragments(identifier) {
    return this.__fragmentState.changedFragments(identifier);
  }

  getFragmentCanonicalState(identifier) {
    return this.__fragmentState.getCanonicalState(identifier);
  }

  getFragmentCurrentState(identifier) {
    return this.__fragmentState.getCurrentState(identifier);
  }

  // ==================
  // V2 Cache Interface Implementation
  // ==================

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
  put(doc) {
    // Normalize id to string to ensure consistent comparison
    if (doc?.content?.data) {
      if (Array.isArray(doc.content.data)) {
        doc.content.data.forEach((resource) => {
          if (resource.id != null && typeof resource.id !== 'string') {
            resource.id = String(resource.id);
          }
        });
      } else if (
        doc.content.data.id != null &&
        typeof doc.content.data.id !== 'string'
      ) {
        doc.content.data.id = String(doc.content.data.id);
      }
    }

    // NEW APPROACH: Store fragment data separately, push to inner cache first, then process fragments
    // This is needed because polymorphic fragment type resolution may require accessing owner attributes,
    // which requires the owner record to exist in the cache first.

    // Step 1: Extract fragment data from resources WITHOUT creating fragment identifiers
    const fragmentDataByIdentifier = new Map();
    if (doc && doc.content && doc.content.data) {
      this._collectFragmentsFromDocument(doc.content, fragmentDataByIdentifier);
    }

    // Step 2: Push to inner cache (this creates the owner records)
    const result = this.__innerCache.put(doc);

    // Step 3: Now that owner records exist, push fragment data to create fragment identifiers
    for (const [identifier, data] of fragmentDataByIdentifier) {
      this.__fragmentState.pushFragmentData(identifier, data, false);
    }

    return result;
  }

  /**
   * Collect fragment attributes from a JSON:API document WITHOUT creating fragment identifiers.
   * This just stores the raw fragment data and removes fragment attributes from resources.
   * Fragment identifiers will be created later after owner records are in the cache.
   *
   * @private
   */
  _collectFragmentsFromDocument(jsonApiDoc, fragmentDataByIdentifier) {
    const { data, included } = jsonApiDoc;

    // Handle single resource
    if (data && !Array.isArray(data)) {
      this._collectFragmentsFromResource(data, fragmentDataByIdentifier);
    }

    // Handle array of resources
    if (Array.isArray(data)) {
      for (const resource of data) {
        this._collectFragmentsFromResource(resource, fragmentDataByIdentifier);
      }
    }

    // Handle included resources
    if (included) {
      for (const resource of included) {
        this._collectFragmentsFromResource(resource, fragmentDataByIdentifier);
      }
    }
  }

  /**
   * Collect fragment attributes from a single resource WITHOUT creating fragment identifiers.
   *
   * @private
   */
  _collectFragmentsFromResource(resource, fragmentDataByIdentifier) {
    if (!resource || !resource.attributes || !resource.type) {
      return;
    }

    // Get or create identifier for this resource
    const identifier =
      this.__storeWrapper.identifierCache.getOrCreateRecordIdentifier({
        type: resource.type,
        id: resource.id,
      });

    const definitions = this.__storeWrapper
      .getSchemaDefinitionService()
      .attributesDefinitionFor(identifier);

    const fragmentData = {};
    const fragmentKeys = [];

    for (const [key, definition] of Object.entries(definitions)) {
      const isFragment =
        definition.isFragment || definition.options?.isFragment;

      if (isFragment && resource.attributes[key] !== undefined) {
        fragmentData[key] = resource.attributes[key];
        fragmentKeys.push(key);
      }
    }

    // Store fragment data for later processing (AFTER inner cache put)
    if (fragmentKeys.length > 0) {
      fragmentDataByIdentifier.set(identifier, { attributes: fragmentData });

      // Clone attributes and remove fragment keys to avoid mutating original data
      // This is necessary because resource.attributes may reference user-provided data
      const cleanedAttributes = { ...resource.attributes };
      for (const key of fragmentKeys) {
        delete cleanedAttributes[key];
      }
      resource.attributes = cleanedAttributes;
    }
  }

  /**
   * Update the "remote" or "canonical" state via a merge operation
   */
  patch(op) {
    return this.__innerCache.patch(op);
  }

  /**
   * Update the "local" or "current" (unpersisted) state
   */
  mutate(mutation) {
    return this.__innerCache.mutate(mutation);
  }

  /**
   * Peek resource data from the Cache
   */
  peek(identifier) {
    return this.__innerCache.peek(identifier);
  }

  /**
   * Peek the Cache for existing request data
   */
  peekRequest(identifier) {
    return this.__innerCache.peekRequest(identifier);
  }

  /**
   * Push resource data from a remote source into the cache.
   * Intercepts to handle fragment attributes.
   *
   * In ember-data 4.13+, the signature is:
   *   upsert(identifier, resource, hasRecord) where resource is the JSON:API resource object
   * In ember-data 4.12, the signature was:
   *   upsert(identifier, data, calculateChanges) where data = { attributes: {...} }
   */
  upsert(identifier, data, hasRecordOrCalculateChanges) {
    // Normalize the id to string to match identifier.id (which is always coerced to string)
    // This ensures cached.id matches identifier.id type when didCommit compares them
    if (data.id != null && typeof data.id !== 'string') {
      data = { ...data, id: String(data.id) };
    }

    // First, extract fragment attributes from data
    let fragmentAttributeKeys = [];
    const fragmentData = {};

    if (data.attributes) {
      const definitions = this.__storeWrapper
        .getSchemaDefinitionService()
        .attributesDefinitionFor(identifier);

      for (const [key, definition] of Object.entries(definitions)) {
        const isFragment =
          definition.isFragment || definition.options?.isFragment;
        if (isFragment && data.attributes[key] !== undefined) {
          fragmentData[key] = data.attributes[key];
          fragmentAttributeKeys.push(key);
        }
      }

      // Remove fragment attributes before passing to inner cache
      if (fragmentAttributeKeys.length > 0) {
        const cleanedData = {
          ...data,
          attributes: { ...data.attributes },
        };
        for (const key of fragmentAttributeKeys) {
          delete cleanedData.attributes[key];
        }
        data = cleanedData;
      }
    }

    // Let inner cache handle non-fragment attributes
    const changedKeys = this.__innerCache.upsert(
      identifier,
      data,
      hasRecordOrCalculateChanges,
    );

    // Handle fragment attributes
    if (fragmentAttributeKeys.length > 0) {
      const changedFragmentKeys = this.__fragmentState.pushFragmentData(
        identifier,
        { attributes: fragmentData },
        hasRecordOrCalculateChanges,
      );
      if (hasRecordOrCalculateChanges && changedFragmentKeys?.length) {
        return [...(changedKeys || []), ...changedFragmentKeys];
      }
    }

    return changedKeys;
  }

  /**
   * Signal to the cache that a new record has been instantiated on the client
   */
  clientDidCreate(identifier, options) {
    // Extract fragment attributes from options before passing to inner cache
    if (options) {
      const definitions = this.__storeWrapper
        .getSchemaDefinitionService()
        .attributesDefinitionFor(identifier);

      const fragmentData = {};
      const regularOptions = {};
      let hasFragmentData = false;

      for (const [key, value] of Object.entries(options)) {
        const definition = definitions[key];
        const isFragmentAttr =
          definition?.isFragment || definition?.options?.isFragment;

        if (isFragmentAttr && value !== undefined) {
          fragmentData[key] = value;
          hasFragmentData = true;
        } else {
          regularOptions[key] = value;
        }
      }

      // IMPORTANT: Create the inner cache entry first, so the owner's attributes
      // are available when fragment typeKey functions try to access them
      const result = this.__innerCache.clientDidCreate(
        identifier,
        regularOptions,
      );

      // Push fragment data to our fragment state manager AFTER the cache entry exists
      if (hasFragmentData) {
        this.__fragmentState.pushFragmentData(
          identifier,
          { attributes: fragmentData },
          false,
        );
      }

      return result;
    }

    return this.__innerCache.clientDidCreate(identifier, options);
  }

  /**
   * Signals to the cache that a resource will be part of a save transaction
   */
  willCommit(identifier) {
    // Handle fragments first
    this.__fragmentState.willCommitFragments(identifier);
    return this.__innerCache.willCommit(identifier);
  }

  /**
   * Signals to the cache that a resource was successfully updated
   */
  didCommit(identifier, data) {
    // In ember-data 4.12+, didCommit receives { request, content } where
    // content is a ResourceDocument with { data: { id, type, attributes, relationships } }
    // We need to extract fragment attributes from data.content.data.attributes

    // Normalize the response id to match the identifier id type
    // ember-data 4.12 does strict equality checking, so '1' !== 1 would fail
    if (
      data?.content?.data?.id != null &&
      typeof data.content.data.id !== 'string'
    ) {
      data = {
        ...data,
        content: {
          ...data.content,
          data: {
            ...data.content.data,
            id: String(data.content.data.id),
          },
        },
      };
    }

    // Let inner cache handle the owner record commit first
    const result = this.__innerCache.didCommit(identifier, data);

    // Extract the attributes from the new structure
    const responseData = data?.content?.data;
    const attributes = responseData?.attributes;

    // Extract fragment data from attributes
    let fragmentData = null;
    if (attributes) {
      const definitions = this.__storeWrapper
        .getSchemaDefinitionService()
        .attributesDefinitionFor(identifier);
      fragmentData = { attributes: {} };

      for (const [key, definition] of Object.entries(definitions)) {
        const isFragment =
          definition.isFragment || definition.options?.isFragment;
        if (isFragment && attributes[key] !== undefined) {
          fragmentData.attributes[key] = attributes[key];
        }
      }

      if (Object.keys(fragmentData.attributes).length === 0) {
        fragmentData = null;
      }
    }

    // Handle fragment commit
    const changedFragmentKeys = this.__fragmentState.didCommitFragments(
      identifier,
      fragmentData,
    );

    // Notify changed fragments
    if (changedFragmentKeys?.length > 0) {
      changedFragmentKeys.forEach((key) => {
        this.__storeWrapper.notifyChange(identifier, 'attributes', key);
      });
    }
    return result;
  }

  /**
   * Signals to the cache that a resource save transaction failed
   */
  commitWasRejected(identifier, errors) {
    this.__fragmentState.commitWasRejectedFragments(identifier);
    return this.__innerCache.commitWasRejected(identifier, errors);
  }

  /**
   * Signals to the cache that all data for a resource should be cleared
   */
  unloadRecord(identifier) {
    this.__fragmentState.unloadFragments(identifier);
    this.__recordDataProxies.delete(identifier.lid);
    return this.__innerCache.unloadRecord(identifier);
  }

  /**
   * Retrieve the data for an attribute from the cache
   */
  getAttr(identifier, attr) {
    // Check if this is a fragment attribute
    const definitions = this.__storeWrapper
      .getSchemaDefinitionService()
      .attributesDefinitionFor(identifier);
    const definition = definitions[attr];

    // Check for fragment attribute - support both metadata formats:
    // - Direct: definition.isFragment (ember-data 4.12 or original metadata)
    // - Transformed: definition.options?.isFragment (from FragmentSchemaService in 4.13)
    const isFragmentAttr =
      definition?.isFragment || definition?.options?.isFragment;

    if (isFragmentAttr) {
      // Fragment attributes are handled by fragment state manager
      // getFragment returns identifier(s), we need to convert to Fragment instance(s)
      const fragmentValue = this.__fragmentState.getFragment(identifier, attr);

      if (fragmentValue === null || fragmentValue === undefined) {
        return fragmentValue;
      }

      // Get the fragment kind from the appropriate location:
      // - Direct: definition.kind (original metadata)
      // - Transformed: definition.options?.fragmentKind (from FragmentSchemaService)
      const fragmentKind = definition.options?.fragmentKind || definition.kind;

      // For single fragments, convert identifier to Fragment instance
      if (fragmentKind === 'fragment') {
        if (fragmentValue.lid) {
          // It's an identifier, get the record instance
          const record = this.store._instanceCache.getRecord(fragmentValue);
          return record;
        }
        return fragmentValue;
      }

      // For fragment arrays and primitive arrays, return the wrapper object
      // This is needed for Snapshot._attributes which expects objects with _createSnapshot
      if (fragmentKind === 'fragment-array' || fragmentKind === 'array') {
        // Get the cached wrapper if it exists
        let arrayWrapper = this.getFragmentArrayCache(identifier, attr);
        if (arrayWrapper) {
          return arrayWrapper;
        }
        // If no wrapper exists yet, convert identifiers to Fragment instances
        // so ext.js patch can call _createSnapshot on each fragment
        if (fragmentKind === 'fragment-array' && Array.isArray(fragmentValue)) {
          const fragments = fragmentValue.map((item) => {
            if (item?.lid) {
              return this.store._instanceCache.getRecord(item);
            }
            return item;
          });
          return fragments;
        }
        // For primitive arrays, return as-is
        return fragmentValue;
      }

      // For single fragment type that fell through, return as-is
      return fragmentValue;
    }

    return this.__innerCache.getAttr(identifier, attr);
  }

  /**
   * Mutate the data for an attribute in the cache
   */
  setAttr(identifier, attr, value) {
    const definitions = this.__storeWrapper
      .getSchemaDefinitionService()
      .attributesDefinitionFor(identifier);
    const definition = definitions[attr];

    const isFragmentAttr =
      definition?.isFragment || definition?.options?.isFragment;

    if (isFragmentAttr) {
      return this.__fragmentState.setDirtyFragment(identifier, attr, value);
    }

    // Track if we had changes before this setAttr
    const hadChanges = this.__innerCache.hasChangedAttrs(identifier);

    // Trigger dirty state propagation for regular attrs
    this.__innerCache.setAttr(identifier, attr, value);

    // Track if we have changes after this setAttr
    const hasChanges = this.__innerCache.hasChangedAttrs(identifier);

    // If dirty state changed, notify state change for hasDirtyAttributes
    if (hadChanges !== hasChanges) {
      this.__storeWrapper.notifyChange(identifier, 'state');
    }

    // Check if record has fragment owner and propagate dirty state
    const owner = this.__fragmentState.getFragmentOwner(identifier);
    if (owner) {
      // Check if the fragment is now dirty or clean
      if (this.__fragmentState.hasChangedAttributes(identifier)) {
        this.__fragmentState._fragmentDidDirty(identifier);
      } else {
        this.__fragmentState._fragmentDidReset(identifier);
      }
    }
  }

  /**
   * Query the cache for the changed attributes of a resource
   */
  changedAttrs(identifier) {
    const changedAttrs = this.__innerCache.changedAttrs(identifier);
    const changedFragments = this.__fragmentState.changedFragments(identifier);
    return Object.assign({}, changedAttrs, changedFragments);
  }

  /**
   * Query the cache for whether any mutated attributes exist
   */
  hasChangedAttrs(identifier) {
    // New records are considered to have dirty attributes since they haven't been saved
    // This is important for fragments created via createFragment
    return (
      this.isNew(identifier) ||
      this.__innerCache.hasChangedAttrs(identifier) ||
      this.__fragmentState.hasChangedFragments(identifier)
    );
  }

  /**
   * Tell the cache to discard any uncommitted mutations to attributes
   */
  rollbackAttrs(identifier) {
    const dirtyAttrKeys = this.__innerCache.rollbackAttrs(identifier);
    const dirtyFragmentKeys =
      this.__fragmentState.rollbackFragments(identifier);
    return [...(dirtyAttrKeys || []), ...(dirtyFragmentKeys || [])];
  }

  /**
   * Query the cache for the current state of a relationship
   */
  getRelationship(identifier, field) {
    return this.__innerCache.getRelationship(identifier, field);
  }

  /**
   * Update the cache state for the given resource to be marked as locally deleted
   */
  setIsDeleted(identifier, isDeleted) {
    return this.__innerCache.setIsDeleted(identifier, isDeleted);
  }

  /**
   * Query the cache for any validation errors applicable to the given resource
   */
  getErrors(identifier) {
    return this.__innerCache.getErrors(identifier);
  }

  /**
   * Query the cache for whether a given resource has any available data
   */
  isEmpty(identifier) {
    return this.__innerCache.isEmpty(identifier);
  }

  /**
   * Query the cache for whether a given resource was created locally
   */
  isNew(identifier) {
    // For fragments that have been committed, they are no longer new
    if (this.__fragmentState.isFragmentCommitted(identifier)) {
      return false;
    }
    return this.__innerCache.isNew(identifier);
  }

  /**
   * Query the cache for whether a given resource is marked as deleted
   */
  isDeleted(identifier) {
    return this.__innerCache.isDeleted(identifier);
  }

  /**
   * Query the cache for whether a given resource has been deleted and persisted
   */
  isDeletionCommitted(identifier) {
    return this.__innerCache.isDeletionCommitted(identifier);
  }

  // ==================
  // Cache forking (delegate to inner)
  // ==================

  fork() {
    return this.__innerCache.fork();
  }

  merge(cache) {
    return this.__innerCache.merge(cache);
  }

  diff() {
    return this.__innerCache.diff();
  }

  // ==================
  // SSR Support (delegate to inner)
  // ==================

  dump() {
    return this.__innerCache.dump();
  }

  hydrate(stream) {
    return this.__innerCache.hydrate(stream);
  }
}
