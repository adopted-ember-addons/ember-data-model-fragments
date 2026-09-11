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
export declare function fragmentTransformFor(serializer: any, attributeType: string, superTransformFor: (...args: any[]) => any): any;
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
export declare function fragmentApplyTransforms(serializer: any, typeClass: any, data: any): any;
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
export declare function fragmentSerialize(serializer: any, snapshot: any, payload: any): any;
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
export declare function fragmentExtractAttributes(serializer: any, modelClass: any, resourceHash: any, superExtractAttributes: (...args: any[]) => any): any;
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
export declare function fragmentExtractAttributesJSONAPI(serializer: any, modelClass: any, resourceHash: any, superExtractAttributes: (...args: any[]) => any): any;
//# sourceMappingURL=utils.d.ts.map