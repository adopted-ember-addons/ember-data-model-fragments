import JSONSerializer from '@ember-data/serializer/json';
import {
  fragmentTransformFor,
  fragmentApplyTransforms,
  fragmentExtractAttributes,
} from './utils';

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
export default class FragmentSerializer extends JSONSerializer {
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
