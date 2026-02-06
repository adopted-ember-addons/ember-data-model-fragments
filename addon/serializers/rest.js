import RESTSerializer from '@ember-data/serializer/rest';
import {
  fragmentTransformFor,
  fragmentApplyTransforms,
  fragmentExtractAttributes,
} from './utils';

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
export default class FragmentRESTSerializer extends RESTSerializer {
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
