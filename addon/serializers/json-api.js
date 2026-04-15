import JSONAPISerializer from '@ember-data/serializer/json-api';
import {
  fragmentTransformFor,
  fragmentApplyTransforms,
  fragmentExtractAttributesJSONAPI,
} from './utils';

/**
  FragmentJSONAPISerializer is the base serializer class for ember-data-model-fragments
  when using JSONAPISerializer.
  
  ```js
  // app/serializers/application.js
  import { FragmentJSONAPISerializer } from 'ember-data-model-fragments/serializer';
  
  export default class ApplicationSerializer extends FragmentJSONAPISerializer {}
  ```

  @class FragmentJSONAPISerializer
  @extends JSONAPISerializer
  @public
*/
export default class FragmentJSONAPISerializer extends JSONAPISerializer {
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
      JSONAPISerializer.prototype.transformFor,
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

    For JSON:API, attributes are nested under resourceHash.attributes.

    @method extractAttributes
    @param {Class} modelClass - The model class
    @param {Object} resourceHash - The raw resource data from the server
    @return {Object} The extracted attributes
    @public
  */
  extractAttributes(modelClass, resourceHash) {
    return fragmentExtractAttributesJSONAPI(
      this,
      modelClass,
      resourceHash,
      JSONAPISerializer.prototype.extractAttributes,
    );
  }
}
