import JSONAPISerializer from '@ember-data/serializer/json-api';
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
    serialize(snapshot: any, options?: any): object;
    /**
      Override _getMappedKey so `attrs` lookups don't warn about fragment
      attributes, which aren't in `modelClass.attributes` from ember-data 4.13
  
      @method _getMappedKey
      @param {String} key
      @param {Class} modelClass
      @return {String}
      @private
    */
    _getMappedKey(key: string, modelClass: any): string;
    /**
      Enables fragment properties to have custom transforms based on the fragment
      type, so that deserialization does not have to happen on the fly
  
      @method transformFor
      @param {String} attributeType - The attribute type to get the transform for
      @return {Transform}
      @public
    */
    transformFor(attributeType: string): unknown;
    /**
      Override applyTransforms to handle polymorphic fragments with a typeKey function
  
      @method applyTransforms
      @param {Class} typeClass - The model class
      @param {Object} data - The data to apply transforms to
      @return {Object} The transformed data
      @public
    */
    applyTransforms(typeClass: any, data: any): any;
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
    extractAttributes(modelClass: any, resourceHash: any): any;
}
//# sourceMappingURL=json-api.d.ts.map