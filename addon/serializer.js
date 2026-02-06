import { assert } from '@ember/debug';
import Mixin from '@ember/object/mixin';
import JSONSerializer from '@ember-data/serializer/json';
import RESTSerializer from '@ember-data/serializer/rest';
import { getOwner } from '@ember/application';

/**
 * Helper function to implement fragment transform lookup.
 * Used by both FragmentSerializer and FragmentRESTSerializer.
 *
 * @param {Serializer} serializer - The serializer instance
 * @param {String} attributeType - The attribute type to get the transform for
 * @param {Function} superTransformFor - The parent class's transformFor method
 * @return {Transform}
 * @private
 */
function fragmentTransformFor(serializer, attributeType, superTransformFor) {
  if (attributeType.indexOf('-mf-') !== 0) {
    return superTransformFor.call(serializer, attributeType);
  }

  const owner = getOwner(serializer);
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
 * Used by both FragmentSerializer and FragmentRESTSerializer.
 *
 * @param {Serializer} serializer - The serializer instance
 * @param {Class} typeClass - The model class
 * @param {Object} data - The data to apply transforms to
 * @return {Object} The transformed data
 * @private
 */
function fragmentApplyTransforms(serializer, typeClass, data) {
  const attributes = typeClass.attributes;

  // Handle regular @attr transforms
  typeClass.eachTransformedAttribute((key, attrType) => {
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
  typeClass.eachComputedProperty((key, meta) => {
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

/**
 * Helper function to extract attributes including fragment attributes.
 * The default extractAttributes only iterates modelClass.eachAttribute which
 * doesn't include fragment attributes (they're computed properties).
 *
 * @param {Serializer} serializer - The serializer instance
 * @param {Class} modelClass - The model class
 * @param {Object} resourceHash - The raw resource data from the server
 * @param {Function} superExtractAttributes - The parent's extractAttributes method
 * @return {Object} The extracted attributes
 * @private
 */
function fragmentExtractAttributes(
  serializer,
  modelClass,
  resourceHash,
  superExtractAttributes,
) {
  // First, call parent to get regular attributes
  const attributes = superExtractAttributes.call(
    serializer,
    modelClass,
    resourceHash,
  );

  // Then, add fragment attributes
  modelClass.eachComputedProperty((key, meta) => {
    if (
      meta &&
      meta.isFragment &&
      (meta.kind === 'fragment' ||
        meta.kind === 'fragment-array' ||
        meta.kind === 'array')
    ) {
      const attributeKey = serializer.keyForAttribute(key, 'deserialize');
      if (resourceHash[attributeKey] !== undefined) {
        attributes[key] = resourceHash[attributeKey];
      }
    }
  });

  return attributes;
}

/**
  FragmentSerializer is the base serializer class for ember-data-model-fragments.
  Extends JSONSerializer.
  
  To use fragment serialization properly, your serializers should extend FragmentSerializer:
  
  ```js
  // app/serializers/application.js
  import FragmentSerializer from 'ember-data-model-fragments/serializer';
  
  export default class ApplicationSerializer extends FragmentSerializer {}
  ```

  @class FragmentSerializer
  @extends JSONSerializer
  @public
*/
class FragmentSerializer extends JSONSerializer {
  /**
    Enables fragment properties to have custom transforms based on the fragment
    type, so that deserialization does not have to happen on the fly

    @method transformFor
    @param {String} attributeType - The attribute type to get the transform for
    @return {Transform}
    @public
  */
  transformFor(attributeType) {
    return fragmentTransformFor(
      this,
      attributeType,
      JSONSerializer.prototype.transformFor,
    );
  }

  /**
    Override applyTransforms to handle polymorphic fragments with a typeKey function
    
    @method applyTransforms
    @param {Class} typeClass - The model class
    @param {Object} data - The data to apply transforms to
    @return {Object} The transformed data
    @public
  */
  applyTransforms(typeClass, data) {
    return fragmentApplyTransforms(this, typeClass, data);
  }

  /**
    Override extractAttributes to include fragment attributes.
    The default implementation only iterates modelClass.eachAttribute which
    doesn't include fragment attributes (they're computed properties with
    isFragment: true metadata).

    @method extractAttributes
    @param {Class} modelClass - The model class
    @param {Object} resourceHash - The raw resource data from the server
    @return {Object} The extracted attributes
    @public
  */
  extractAttributes(modelClass, resourceHash) {
    return fragmentExtractAttributes(
      this,
      modelClass,
      resourceHash,
      JSONSerializer.prototype.extractAttributes,
    );
  }
}

/**
  FragmentRESTSerializer is the base serializer class for ember-data-model-fragments
  when using RESTSerializer.
  
  ```js
  // app/serializers/application.js
  import { FragmentRESTSerializer } from 'ember-data-model-fragments/serializer';
  
  export default class ApplicationSerializer extends FragmentRESTSerializer {}
  ```

  @class FragmentRESTSerializer
  @extends RESTSerializer
  @public
*/
class FragmentRESTSerializer extends RESTSerializer {
  /**
    Enables fragment properties to have custom transforms based on the fragment
    type, so that deserialization does not have to happen on the fly

    @method transformFor
    @param {String} attributeType - The attribute type to get the transform for
    @return {Transform}
    @public
  */
  transformFor(attributeType) {
    return fragmentTransformFor(
      this,
      attributeType,
      RESTSerializer.prototype.transformFor,
    );
  }

  /**
    Override applyTransforms to handle polymorphic fragments with a typeKey function
    
    @method applyTransforms
    @param {Class} typeClass - The model class
    @param {Object} data - The data to apply transforms to
    @return {Object} The transformed data
    @public
  */
  applyTransforms(typeClass, data) {
    return fragmentApplyTransforms(this, typeClass, data);
  }

  /**
    Override extractAttributes to include fragment attributes.
    The default implementation only iterates modelClass.eachAttribute which
    doesn't include fragment attributes (they're computed properties with
    isFragment: true metadata).

    @method extractAttributes
    @param {Class} modelClass - The model class
    @param {Object} resourceHash - The raw resource data from the server
    @return {Object} The extracted attributes
    @public
  */
  extractAttributes(modelClass, resourceHash) {
    return fragmentExtractAttributes(
      this,
      modelClass,
      resourceHash,
      RESTSerializer.prototype.extractAttributes,
    );
  }
}

/**
  FragmentSerializerMixin provides fragment-aware serialization capabilities
  that can be mixed into any serializer class (JSONSerializer, RESTSerializer, JSONAPISerializer, etc.)
  
  ```js
  // app/serializers/application.js
  import JSONAPISerializer from '@ember-data/serializer/json-api';
  import { FragmentSerializerMixin } from 'ember-data-model-fragments/serializer';
  
  export default class ApplicationSerializer extends JSONAPISerializer.extend(FragmentSerializerMixin) {}
  ```

  @class FragmentSerializerMixin
  @public
*/
const FragmentSerializerMixin = Mixin.create({
  /**
    Enables fragment properties to have custom transforms based on the fragment
    type, so that deserialization does not have to happen on the fly

    @method transformFor
    @param {String} attributeType - The attribute type to get the transform for
    @return {Transform}
    @public
  */
  transformFor(attributeType, skipAssertion) {
    if (attributeType.indexOf('-mf-') !== 0) {
      return this._super(attributeType, skipAssertion);
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

  /**
    Override applyTransforms to handle polymorphic fragments with a typeKey function
    
    @method applyTransforms
    @param {Class} typeClass - The model class
    @param {Object} data - The data to apply transforms to
    @return {Object} The transformed data
    @public
  */
  applyTransforms(typeClass, data) {
    return fragmentApplyTransforms(this, typeClass, data);
  },

  /**
    Override extractAttributes to include fragment attributes.
    The default implementation only iterates modelClass.eachAttribute which
    doesn't include fragment attributes (they're computed properties with
    isFragment: true metadata).

    @method extractAttributes
    @param {Class} modelClass - The model class
    @param {Object} resourceHash - The raw resource data from the server
    @return {Object} The extracted attributes
    @public
  */
  extractAttributes(modelClass, resourceHash) {
    // First, call parent to get regular attributes
    const attributes = this._super(modelClass, resourceHash);

    // Then, add fragment attributes
    // For JSON:API serializers, attributes are nested under resourceHash.attributes
    // For JSON/REST serializers, attributes are directly on resourceHash
    const attrHash = resourceHash.attributes || resourceHash;

    modelClass.eachComputedProperty((key, meta) => {
      if (
        meta &&
        meta.isFragment &&
        (meta.kind === 'fragment' ||
          meta.kind === 'fragment-array' ||
          meta.kind === 'array')
      ) {
        const attributeKey = this.keyForAttribute(key, 'deserialize');
        if (attrHash[attributeKey] !== undefined) {
          attributes[key] = attrHash[attributeKey];
        }
      }
    });

    return attributes;
  },
});

export default FragmentSerializer;
export { FragmentSerializer, FragmentRESTSerializer, FragmentSerializerMixin };
