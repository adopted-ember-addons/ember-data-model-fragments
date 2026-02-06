import {
  macroCondition,
  dependencySatisfies,
  importSync,
} from '@embroider/macros';

/**
 * FragmentSchemaService extends ModelSchemaProvider to add support for fragment attributes.
 *
 * In ember-data 4.13+, the schema service only recognizes attributes with `kind: 'attribute'`.
 * Fragment attributes use `kind: 'fragment'`, `kind: 'fragment-array'`, or `kind: 'array'`,
 * so they need to be transformed to be included in the schema.
 *
 * This class overrides `_loadModelSchema()` to:
 * 1. Call the parent implementation to load standard attributes and relationships
 * 2. Scan the model for fragment attributes
 * 3. Transform fragment metadata to be recognized by the schema service
 * 4. Add transformed fragments to the schema
 *
 * NOTE: This class only exists in ember-data 4.13+. For 4.12, this module exports null.
 *
 * @class FragmentSchemaService
 * @extends ModelSchemaProvider
 * @public
 */
let FragmentSchemaService = null;

if (macroCondition(dependencySatisfies('ember-data', '>=4.13.0-alpha.0'))) {
  const { ModelSchemaProvider } = importSync('@ember-data/model');

  FragmentSchemaService = class FragmentSchemaService extends (
    ModelSchemaProvider
  ) {
    /**
     * Override _loadModelSchema to include fragment attributes in the schema.
     *
     * The parent implementation only includes attributes where `meta.kind === 'attribute'`.
     * We need to also include fragment attributes and transform them to be compatible.
     *
     * @method _loadModelSchema
     * @param {String} type - The model type name
     * @return {Object} internalSchema - The schema with attributes, relationships, and fields
     * @private
     */
    _loadModelSchema(type) {
      // Call parent implementation to get standard schema (attributes + relationships)
      const internalSchema = super._loadModelSchema(type);

      // Get the model class to scan for fragment attributes
      const modelClass = this.store.modelFor(type);

      // Scan computed properties for fragment attributes
      modelClass.eachComputedProperty((name, meta) => {
        if (this._isFragmentAttribute(meta)) {
          // Transform fragment metadata to be recognized as an attribute
          // while preserving fragment-specific information
          const transformedMeta = {
            name,
            key: name, // ember-data expects this
            kind: 'attribute', // Change to 'attribute' so schema service recognizes it
            // Keep the original type for transform lookup
            type: meta.type,
            options: {
              ...meta.options,
              isFragment: true, // Mark as fragment in options
              fragmentKind: meta.kind, // Preserve original kind
              modelName: meta.modelName,
            },
            isAttribute: true, // Required by ember-data
            isFragment: true, // Preserve for our code
            modelName: meta.modelName, // Preserve model name at top level
          };

          // Add to all three schema structures:
          // 1. attributes object (used by attributesDefinitionFor - legacy API)
          internalSchema.attributes[name] = transformedMeta;

          // 2. fields Map (used by fields() - new API)
          internalSchema.fields.set(name, transformedMeta);

          // 3. schema.fields array (used by resource() - new API)
          // Note: We'll rebuild this array after the loop to avoid duplicates
        }
      });

      // Rebuild schema.fields array from the fields Map
      // This ensures it includes all attributes, relationships, AND fragments
      internalSchema.schema.fields = Array.from(internalSchema.fields.values());

      return internalSchema;
    }

    /**
     * Check if a computed property metadata object represents a fragment attribute.
     *
     * Fragment attributes have:
     * - isFragment: true
     * - kind: 'fragment', 'fragment-array', or 'array'
     *
     * @method _isFragmentAttribute
     * @param {Object} meta - The computed property metadata
     * @return {Boolean}
     * @private
     */
    _isFragmentAttribute(meta) {
      return (
        typeof meta === 'object' &&
        meta !== null &&
        'kind' in meta &&
        meta.isFragment === true &&
        (meta.kind === 'fragment' ||
          meta.kind === 'fragment-array' ||
          meta.kind === 'array')
      );
    }
  };
}

export default FragmentSchemaService;
