import { assert } from '@ember/debug';
import { getOwner } from '@ember/owner';

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
  superTransformFor: (this: any, attributeType: string) => any,
) {
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
    let transformClass = owner.factoryFor(`transform:${transformName}`);
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
) {
  const attributes = typeClass.attributes;

  // Handle regular @attr transforms
  typeClass.eachTransformedAttribute((key: string, attrType: string) => {
    if (data[key] === undefined) {
      return;
    }

    const transform = serializer.transformFor(attrType);
    const transformMeta = attributes.get(key);
    data[key] = transform.deserialize(data[key], transformMeta.options, data);
  });

  // Also handle @array computed properties with transforms
  // These are not in eachTransformedAttribute because they're computed properties,
  // not regular @attr attributes
  typeClass.eachComputedProperty((key: string, meta: any) => {
    if (data[key] === undefined) {
      return;
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

function isFragmentAttribute(meta: any) {
  return (
    meta &&
    meta.isFragment &&
    (meta.kind === 'fragment' ||
      meta.kind === 'fragment-array' ||
      meta.kind === 'array')
  );
}

function serializedAttributesHash(
  serializer: any,
  snapshot: any,
  payload: any,
) {
  if (payload?.data?.attributes) {
    return payload.data.attributes;
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
) {
  const attributes = serializedAttributesHash(serializer, snapshot, payload);
  const modelClass = serializer.store.modelFor(snapshot.modelName);

  modelClass.eachComputedProperty((key: string, meta: any) => {
    if (!isFragmentAttribute(meta)) {
      return;
    }

    const value = snapshot.attr(key);

    if (value === undefined) {
      return;
    }

    const attributeKey = serializer.keyForAttribute(key, 'serialize');
    const transform = serializer.transformFor(meta.type);

    attributes[attributeKey] = transform.serialize(
      value,
      meta.options,
      snapshot,
    );
  });

  return payload;
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
  superExtractAttributes: (
    this: any,
    modelClass: any,
    resourceHash: any,
  ) => any,
) {
  // First, call parent to get regular attributes
  const attributes = superExtractAttributes.call(
    serializer,
    modelClass,
    resourceHash,
  );

  // Then, add fragment attributes
  modelClass.eachComputedProperty((key: string, meta: any) => {
    if (isFragmentAttribute(meta)) {
      const attributeKey = serializer.keyForAttribute(key, 'deserialize');
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
  superExtractAttributes: (
    this: any,
    modelClass: any,
    resourceHash: any,
  ) => any,
) {
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
      const attributeKey = serializer.keyForAttribute(key, 'deserialize');
      if (attrHash[attributeKey] !== undefined) {
        attributes[key] = attrHash[attributeKey];
      }
    }
  });

  return attributes;
}
