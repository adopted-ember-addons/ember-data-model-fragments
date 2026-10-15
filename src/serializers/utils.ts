import { assert } from '@ember/debug';
import { getOwner } from '@ember/application';
import JSONAPISerializer from '@ember-data/serializer/json-api';
import RESTSerializer from '@ember-data/serializer/rest';

/**
 * Helper function to implement fragment transform lookup.
 * Used by FragmentSerializer, FragmentRESTSerializer, and FragmentJSONAPISerializer.
 *
 * @param {Serializer} serializer - The serializer instance
 * @param {String} attributeType - The attribute type to get the transform for
 * @param {Function} superTransformFor - The parent class's transformFor method
 * @return {Transform}
 * @private
 */
export function fragmentTransformFor(
  serializer: any,
  attributeType: string,
  superTransformFor: (...args: any[]) => any,
): any {
  if (attributeType.indexOf('-mf-') !== 0) {
    return superTransformFor.call(serializer, attributeType);
  }

  const owner: any = getOwner(serializer);
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
    let transformClass: any = owner.factoryFor(`transform:${transformName}`);
    transformClass = transformClass && transformClass.class;
    transformClass = transformClass.extend({
      type,
      polymorphicTypeProp,
      store: serializer.store,
    });
    owner.register(containerKey, transformClass);
  }
  return owner.lookup(containerKey);
}

/**
 * Helper function to implement fragment-aware applyTransforms.
 * Used by FragmentSerializer, FragmentRESTSerializer, and FragmentJSONAPISerializer.
 *
 * @param {Serializer} serializer - The serializer instance
 * @param {Class} typeClass - The model class
 * @param {Object} data - The data to apply transforms to
 * @return {Object} The transformed data
 * @private
 */
export function fragmentApplyTransforms(
  serializer: any,
  typeClass: any,
  data: any,
): any {
  const attributes = typeClass.attributes;
  const transformed = new Set<string>();

  // Handle regular @attr transforms
  typeClass.eachTransformedAttribute((key: string, attrType: string) => {
    transformed.add(key);

    if (data[key] === undefined) {
      return;
    }

    const transform = serializer.transformFor(attrType);
    const transformMeta = attributes.get(key);
    data[key] = transform.deserialize(data[key], transformMeta.options, data);
  });

  // Also handle fragment and @array computed properties. Below ember-data
  // 4.13 fragment attributes are in eachTransformedAttribute, so they're
  // already transformed; from 4.13 they aren't
  typeClass.eachComputedProperty((key: string, meta: any) => {
    if (data[key] === undefined || transformed.has(key)) {
      return;
    }

    if (
      meta?.isFragment &&
      (meta.kind === 'fragment' || meta.kind === 'fragment-array')
    ) {
      const transform = serializer.transformFor(meta.type);
      data[key] = transform.deserialize(data[key], meta.options, data);
    }

    // Only handle @array attributes that have a transform type (arrayTransform)
    // meta.arrayTransform is the child transform type (e.g., 'string')
    // meta.type is the full transform type string (e.g., '-mf-array$string')
    if (meta?.isFragment && meta.kind === 'array' && meta.arrayTransform) {
      // Use the full transform type string from meta.type
      const transform = serializer.transformFor(meta.type);
      data[key] = transform.deserialize(data[key], meta.options, data);
    }
  });

  return data;
}

// The payload key that `attrs` maps an attribute to, if any
function mappedKey(serializer: any, key: string): string | undefined {
  const mapping = serializer.attrs?.[key];
  return typeof mapping === 'string' ? mapping : mapping?.key;
}

// From ember-data 4.13, `normalizeUsingDeclaredMapping` doesn't apply `attrs`
// to fragment attributes, as they aren't in `modelClass.attributes`
function payloadKeyFor(serializer: any, key: string, hash: any): string {
  const mapped = mappedKey(serializer, key);

  return mapped !== undefined && hash[mapped] !== undefined
    ? mapped
    : serializer.keyForAttribute(key, 'deserialize');
}

function isFragmentAttribute(meta: any): boolean {
  return (
    meta &&
    meta.isFragment &&
    (meta.kind === 'fragment' ||
      meta.kind === 'fragment-array' ||
      meta.kind === 'array')
  );
}

function serializedResource(serializer: any, snapshot: any, payload: any): any {
  // JSON:API: the resource is payload.data, and serializeAttribute writes
  // into its `attributes`. We dispatch by serializer type rather than payload
  // shape, because a model could legitimately declare an @attr named `data`
  // under RESTSerializer / JSONSerializer and we must not clobber it.
  if (serializer instanceof JSONAPISerializer) {
    if (payload?.data && typeof payload.data === 'object') {
      return payload.data;
    }
    return payload;
  }

  // RESTSerializer: payload is keyed by the model's payload key, e.g.
  // `{ person: { ...attrs } }`.
  if (serializer instanceof RESTSerializer) {
    const rootKey = serializer.payloadKeyFromModelName?.(snapshot.modelName);
    if (rootKey && payload?.[rootKey] && typeof payload[rootKey] === 'object') {
      return payload[rootKey];
    }
    return payload;
  }

  // JSONSerializer (default): flat hash keyed by attribute names.
  return payload;
}

/**
 * Helper function to serialize computed fragment attributes that newer
 * ember-data versions no longer include via eachAttribute.
 *
 * @param {Serializer} serializer
 * @param {Snapshot} snapshot
 * @param {Object} payload
 * @return {Object}
 * @private
 */
export function fragmentSerialize(
  serializer: any,
  snapshot: any,
  payload: any,
): any {
  const resource = serializedResource(serializer, snapshot, payload);
  const modelClass = serializer.store.modelFor(snapshot.modelName);

  // Below ember-data 5.8 `eachAttribute` includes fragment attributes, so the
  // base serializer has already serialized them
  const serializedByBase = new Set<string>();
  snapshot.eachAttribute((key: string) => serializedByBase.add(key));

  modelClass.eachComputedProperty((key: string, meta: any) => {
    if (!isFragmentAttribute(meta) || serializedByBase.has(key)) {
      return;
    }

    if (snapshot.attr(key) === undefined) {
      return;
    }

    // Through serializeAttribute, as the base serializer does below 5.8, so
    // overrides of it apply on every version
    serializer.serializeAttribute(snapshot, resource, key, meta);
  });

  return payload;
}

const fragmentKeysByModel = new WeakMap<object, Set<string>>();

function fragmentKeysFor(modelClass: any): Set<string> {
  let keys = fragmentKeysByModel.get(modelClass);

  if (!keys) {
    keys = new Set();
    modelClass.eachComputedProperty((key: string, meta: any) => {
      if (isFragmentAttribute(meta)) {
        keys!.add(key);
      }
    });
    fragmentKeysByModel.set(modelClass, keys);
  }

  return keys;
}

/**
 * Helper function to implement `_getMappedKey` without its warning for
 * fragment attributes. From ember-data 4.13 they aren't in
 * `modelClass.attributes`, so `_getMappedKey` warns that each one doesn't
 * exist, both when serializing and when normalizing with `attrs`.
 *
 * Used by FragmentSerializer, FragmentRESTSerializer, and FragmentJSONAPISerializer.
 *
 * @param {Serializer} serializer
 * @param {String} key
 * @param {Class} modelClass
 * @param {Function} superGetMappedKey - The parent's _getMappedKey method
 * @return {String}
 * @private
 */
export function fragmentGetMappedKey(
  serializer: any,
  key: string,
  modelClass: any,
  superGetMappedKey: (...args: any[]) => any,
): string {
  if (fragmentKeysFor(modelClass).has(key)) {
    return mappedKey(serializer, key) ?? key;
  }

  return superGetMappedKey.call(serializer, key, modelClass);
}

/**
 * Helper function to extract attributes including fragment attributes.
 * The default extractAttributes only iterates modelClass.eachAttribute which
 * doesn't include fragment attributes (they're computed properties).
 *
 * Used by FragmentSerializer and FragmentRESTSerializer.
 *
 * @param {Serializer} serializer - The serializer instance
 * @param {Class} modelClass - The model class
 * @param {Object} resourceHash - The raw resource data from the server
 * @param {Function} superExtractAttributes - The parent's extractAttributes method
 * @return {Object} The extracted attributes
 * @private
 */
export function fragmentExtractAttributes(
  serializer: any,
  modelClass: any,
  resourceHash: any,
  superExtractAttributes: (...args: any[]) => any,
): any {
  // First, call parent to get regular attributes
  const attributes = superExtractAttributes.call(
    serializer,
    modelClass,
    resourceHash,
  );

  // Then, add fragment attributes
  modelClass.eachComputedProperty((key: string, meta: any) => {
    if (isFragmentAttribute(meta)) {
      const attributeKey = payloadKeyFor(serializer, key, resourceHash);
      if (resourceHash[attributeKey] !== undefined) {
        attributes[key] = resourceHash[attributeKey];
      }
    }
  });

  return attributes;
}

/**
 * Helper function to extract attributes including fragment attributes for JSON:API.
 * JSON:API serializers have attributes nested under resourceHash.attributes.
 *
 * Used by FragmentJSONAPISerializer.
 *
 * @param {Serializer} serializer - The serializer instance
 * @param {Class} modelClass - The model class
 * @param {Object} resourceHash - The raw resource data from the server
 * @param {Function} superExtractAttributes - The parent's extractAttributes method
 * @return {Object} The extracted attributes
 * @private
 */
export function fragmentExtractAttributesJSONAPI(
  serializer: any,
  modelClass: any,
  resourceHash: any,
  superExtractAttributes: (...args: any[]) => any,
): any {
  // First, call parent to get regular attributes
  const attributes = superExtractAttributes.call(
    serializer,
    modelClass,
    resourceHash,
  );

  // For JSON:API serializers, attributes are nested under resourceHash.attributes
  const attrHash = resourceHash.attributes || resourceHash;

  // Then, add fragment attributes
  modelClass.eachComputedProperty((key: string, meta: any) => {
    if (isFragmentAttribute(meta)) {
      const attributeKey = payloadKeyFor(serializer, key, attrHash);
      if (attrHash[attributeKey] !== undefined) {
        attributes[key] = attrHash[attributeKey];
      }
    }
  });

  return attributes;
}
