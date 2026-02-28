import { assert } from '@ember/debug';
import Store from '@ember-data/store';
import Model from '@ember-data/model';
import { Snapshot } from '@ember-data/legacy-compat/-private';
import { dasherize } from '@ember/string';
import JSONSerializer from '@ember-data/serializer/json';
import FragmentCache from './cache/fragment-cache';
import { default as Fragment } from './fragment';
import { isPresent } from '@ember/utils';
import { getOwner } from '@ember/application';

function serializerForFragment(owner, normalizedModelName) {
  let serializer = owner.lookup(`serializer:${normalizedModelName}`);

  if (serializer !== undefined) {
    return serializer;
  }

  // no serializer found for the specific model, fallback and check for application serializer
  serializer = owner.lookup('serializer:-fragment');
  if (serializer !== undefined) {
    return serializer;
  }

  // final fallback, no model specific serializer, no application serializer, no
  // `serializer` property on store: use json-api serializer
  serializer = owner.lookup('serializer:-default');

  return serializer;
}
/**
  @module ember-data-model-fragments
*/

/**
  @class Store
  @namespace DS
*/

const storeMixin = {
  /**
   * Override createCache to return our FragmentCache
   * This is the V2 Cache hook introduced in ember-data 4.7+
   */
  createCache(storeWrapper) {
    return new FragmentCache(storeWrapper);
  },

  /**
   * Override teardownRecord to handle fragments in a disconnected state.
   * In ember-data 4.12+, fragments can end up disconnected during unload,
   * and the default teardownRecord fails when trying to destroy them.
   */
  teardownRecord(record) {
    if (record.isDestroyed || record.isDestroying) {
      return;
    }
    try {
      record.destroy();
    } catch (e) {
      if (
        e?.message?.includes?.('disconnected state') ||
        e?.message?.includes?.('cannot utilize the store')
      ) {
        return;
      }
      throw e;
    }
  },

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
    @param {String} type
    @param {Object} properties a hash of properties to set on the
      newly created fragment.
    @return {MF.Fragment} fragment
  */
  createFragment(modelName, props) {
    assert(
      `The '${modelName}' model must be a subclass of MF.Fragment`,
      this.isFragment(modelName),
    );
    const identifier = this.identifierCache.createIdentifierForNewRecord({
      type: modelName,
    });
    this.cache.clientDidCreate(identifier, props || {});
    return this._instanceCache.getRecord(identifier, props);
  },

  /**
    Returns true if the modelName is a fragment, false if not

    @method isFragment
    @private
    @param {String} the modelName to check if a fragment
    @return {boolean}
  */
  isFragment(modelName) {
    if (modelName === 'application' || modelName === '-default') {
      return false;
    }

    const type = this.modelFor(modelName);
    return Fragment.detect(type);
  },

  serializerFor(modelName) {
    assert(
      "You need to pass a model name to the store's serializerFor method",
      isPresent(modelName),
    );
    assert(
      `Passing classes to store.serializerFor has been removed. Please pass a dasherized string instead of ${modelName}`,
      typeof modelName === 'string',
    );

    const owner = getOwner(this);
    const normalizedModelName = dasherize(modelName);

    if (this.isFragment(normalizedModelName)) {
      return serializerForFragment(owner, normalizedModelName);
    } else {
      return this._super
        ? this._super(...arguments)
        : _originalSerializerFor.call(this, modelName);
    }
  },
};

const _originalSerializerFor = Store.prototype.serializerFor;

// Apply non-cache methods via reopen (when available) or prototype patching
const { createCache: _createCache, ...otherStoreMixin } = storeMixin;

if (typeof Store.reopen === 'function') {
  Store.reopen(otherStoreMixin);
} else {
  for (const [key, value] of Object.entries(otherStoreMixin)) {
    Store.prototype[key] = value;
  }
}

// In warp-drive 5.8+, `isAttributeSchema(meta)` checks `kind === 'attribute'`,
// excluding our fragment/fragment-array/array kinds from Model.attributes,
// eachAttribute, transformedAttributes, eachTransformedAttribute, and the schema
// service's attributesDefinitionFor. We patch at two levels:
// 1. Model.attributes (static getter) - the root that feeds everything else
// 2. Store.schema (getter) - to patch attributesDefinitionFor on the schema service

// Patch Model.attributes to include fragment-kind computed properties.
// In 4.12, isAttributeSchema checks `isAttribute: true` (which our meta has),
// so this patch is a no-op. In 5.8+, it checks `kind === 'attribute'` which
// excludes our fragment kinds.
const _originalAttributesDescriptor = Object.getOwnPropertyDescriptor(
  Model,
  'attributes',
);
if (_originalAttributesDescriptor && _originalAttributesDescriptor.get) {
  Object.defineProperty(Model, 'attributes', {
    get() {
      const map = _originalAttributesDescriptor.get.call(this);
      // Add any fragment attributes that were excluded
      this.eachComputedProperty((name, meta) => {
        if (meta.isFragment && !map.has(name)) {
          meta.key = name;
          meta.name = name;
          map.set(name, meta);
        }
      });
      return map;
    },
    configurable: true,
  });
}

// Patch Store.schema getter to also patch attributesDefinitionFor on the
// schema service. We must patch the getter (not createSchemaService) because
// the ember-data 5.8 Store subclass defines its own createSchemaService()
// that shadows prototype patches.
const _originalSchemaDescriptor = Object.getOwnPropertyDescriptor(
  Store.prototype,
  'schema',
);

function _patchSchemaService(schemaService, store) {
  if (schemaService.__fragmentPatched) {
    return schemaService;
  }
  const _origAttrsFor =
    schemaService.attributesDefinitionFor.bind(schemaService);
  schemaService.attributesDefinitionFor = function (identifier) {
    const definitions = _origAttrsFor(identifier);
    // Check if fragment attributes are missing (5.8+ filters by kind)
    try {
      const modelClass = store.modelFor(identifier.type);
      if (modelClass) {
        modelClass.eachComputedProperty((name, meta) => {
          if (meta.isFragment && !(name in definitions)) {
            definitions[name] = Object.assign({ name }, meta);
          }
        });
      }
    } catch {
      // modelFor may fail for non-existent types
    }
    return definitions;
  };
  schemaService.__fragmentPatched = true;
  return schemaService;
}

if (_originalSchemaDescriptor && _originalSchemaDescriptor.get) {
  Object.defineProperty(Store.prototype, 'schema', {
    get() {
      const schema = _originalSchemaDescriptor.get.call(this);
      if (schema) {
        _patchSchemaService(schema, this);
      }
      return schema;
    },
    configurable: true,
  });
}

// Always use cache getter override for createCache. In ember-data 5.8+,
// the ember-data package defines a Store subclass with its own createCache
// that returns JSONAPICache, shadowing any reopen/prototype patch on the
// base Store. By overriding the cache getter, we intercept at a higher
// level and wrap whatever cache was created in our FragmentCache.
const _originalCacheDescriptor = Object.getOwnPropertyDescriptor(
  Store.prototype,
  'cache',
);
if (_originalCacheDescriptor && _originalCacheDescriptor.get) {
  Object.defineProperty(Store.prototype, 'cache', {
    get() {
      const cache = _originalCacheDescriptor.get.call(this);
      if (cache && !(cache instanceof FragmentCache)) {
        const fragmentCache = new FragmentCache(
          this._instanceCache._storeWrapper,
          cache,
        );
        this._instanceCache.cache = fragmentCache;
        return fragmentCache;
      }
      return cache;
    },
    configurable: true,
  });
} else {
  // Fallback for older ember-data without cache getter (shouldn't happen)
  if (typeof Store.reopen === 'function') {
    Store.reopen({ createCache: _createCache });
  } else {
    Store.prototype.createCache = _createCache;
  }
}

/**
  Override `Snapshot._attributes` to snapshot fragment attributes before they are
  passed to the `DS.Model#serialize`.

  @private
*/
const oldSnapshotAttributes = Object.getOwnPropertyDescriptor(
  Snapshot.prototype,
  '_attributes',
);

Object.defineProperty(Snapshot.prototype, '_attributes', {
  get() {
    const attrs = oldSnapshotAttributes.get.call(this);

    // In warp-drive 5.8+, eachAttribute only iterates kind === 'attribute',
    // so fragment attributes are missing. Add them from the cache.
    const cache = this._store.cache;
    if (cache && typeof cache.getFragment === 'function') {
      const schema = this._store.schema;
      if (schema) {
        const definitions = schema.attributesDefinitionFor(this.identifier);
        for (const [key, definition] of Object.entries(definitions)) {
          if (definition.isFragment && !(key in attrs)) {
            attrs[key] = cache.getAttr(this.identifier, key);
          }
        }
      }
    }

    Object.keys(attrs).forEach((key) => {
      const attr = attrs[key];
      // If the attribute has a `_createSnapshot` method, invoke it before the
      // snapshot gets passed to the serializer
      if (attr && typeof attr._createSnapshot === 'function') {
        attrs[key] = attr._createSnapshot();
      }
      // Handle arrays of fragments (fragment arrays)
      else if (Array.isArray(attr)) {
        attrs[key] = attr.map((item) => {
          if (item && typeof item._createSnapshot === 'function') {
            return item._createSnapshot();
          }
          return item;
        });
      }
    });
    return attrs;
  },
});

/**
  @class JSONSerializer
  @namespace DS
*/

const _originalTransformFor = JSONSerializer.prototype.transformFor;

const serializerMixin = {
  /**
    Enables fragment properties to have custom transforms based on the fragment
    type, so that deserialization does not have to happen on the fly

    @method transformFor
    @private
  */
  transformFor(attributeType) {
    if (attributeType.indexOf('-mf-') !== 0) {
      return this._super
        ? this._super(...arguments)
        : _originalTransformFor.call(this, attributeType);
    }

    const owner = getOwner(this);
    const containerKey = `transform:${attributeType}`;

    if (!owner.hasRegistration(containerKey)) {
      const match = attributeType.match(
        /^-mf-(fragment|fragment-array|array)(?:\$([^$]+))?(?:\$(.+))?$/,
      );
      assert(
        `Failed parsing ember-data-model-fragments attribute type ${attributeType}`,
        match != null,
      );
      const transformName = match[1];
      const type = match[2];
      const polymorphicTypeProp = match[3];
      let transformClass = owner.factoryFor(`transform:${transformName}`);
      transformClass = transformClass && transformClass.class;
      transformClass = transformClass.extend({
        type,
        polymorphicTypeProp,
        store: this.store,
      });
      owner.register(containerKey, transformClass);
    }
    return owner.lookup(containerKey);
  },

  // We need to override this to handle polymorphic with a typeKey function
  applyTransforms(typeClass, data) {
    const attributes = typeClass.attributes;

    typeClass.eachTransformedAttribute((key, typeClass) => {
      if (data[key] === undefined) {
        return;
      }

      const transform = this.transformFor(typeClass);
      const transformMeta = attributes.get(key);
      data[key] = transform.deserialize(data[key], transformMeta.options, data);
    });

    return data;
  },
};

if (typeof JSONSerializer.reopen === 'function') {
  JSONSerializer.reopen(serializerMixin);
} else {
  for (const [key, value] of Object.entries(serializerMixin)) {
    JSONSerializer.prototype[key] = value;
  }
}

export { Store, Model, JSONSerializer };
