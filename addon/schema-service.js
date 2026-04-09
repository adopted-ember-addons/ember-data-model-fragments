function getType(resource) {
  return typeof resource === 'string' ? resource : resource.type;
}

function isFragmentAttribute(meta) {
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

function transformFragmentMeta(name, meta) {
  return {
    name,
    key: name,
    kind: 'attribute',
    type: meta.type,
    options: {
      ...meta.options,
      isFragment: true,
      fragmentKind: meta.kind,
      modelName: meta.modelName,
    },
    isAttribute: true,
    isFragment: true,
    modelName: meta.modelName,
  };
}

export default class FragmentSchemaService {
  constructor(store, schema) {
    this.store = store;
    this._schema = schema;
  }

  _fragmentDefinitionsFor(resource) {
    const type = getType(resource);
    const modelClass = this.store.modelFor(type);
    const definitions = Object.create(null);

    modelClass.eachComputedProperty((name, meta) => {
      if (isFragmentAttribute(meta)) {
        definitions[name] = transformFragmentMeta(name, meta);
      }
    });

    return definitions;
  }

  _mergedFields(resource) {
    const fields = new Map(this._schema.fields(resource));
    const fragments = this._fragmentDefinitionsFor(resource);

    Object.keys(fragments).forEach((name) => {
      fields.set(name, fragments[name]);
    });

    return fields;
  }

  resourceTypes() {
    return this._schema.resourceTypes();
  }

  hasResource(resource) {
    return this._schema.hasResource(resource);
  }

  hasTrait(type) {
    return this._schema.hasTrait(type);
  }

  resourceHasTrait(resource, trait) {
    return this._schema.resourceHasTrait(resource, trait);
  }

  fields(resource) {
    return this._mergedFields(resource);
  }

  cacheFields(resource) {
    return this._schema.cacheFields?.(resource);
  }

  transformation(field) {
    return this._schema.transformation(field);
  }

  hashFn(field) {
    return this._schema.hashFn(field);
  }

  derivation(field) {
    return this._schema.derivation(field);
  }

  resource(resource) {
    const schema = this._schema.resource(resource);

    return {
      ...schema,
      fields: Array.from(this._mergedFields(resource).values()),
    };
  }

  registerResources(schemas) {
    this._schema.registerResources(schemas);
  }

  registerResource(schema) {
    this._schema.registerResource(schema);
  }

  registerTransformation(transform) {
    this._schema.registerTransformation(transform);
  }

  registerDerivation(derivation) {
    this._schema.registerDerivation(derivation);
  }

  registerHashFn(hashFn) {
    this._schema.registerHashFn(hashFn);
  }

  registerTrait(trait) {
    this._schema.registerTrait?.(trait);
  }

  attributesDefinitionFor(resource) {
    const attributes = this._schema.attributesDefinitionFor
      ? { ...this._schema.attributesDefinitionFor(resource) }
      : Object.create(null);
    const fragments = this._fragmentDefinitionsFor(resource);

    return Object.assign(attributes, fragments);
  }

  relationshipsDefinitionFor(resource) {
    return this._schema.relationshipsDefinitionFor?.(resource);
  }

  doesTypeExist(type) {
    return this._schema.doesTypeExist?.(type) ?? this.hasResource({ type });
  }

  CAUTION_MEGA_DANGER_ZONE_registerExtension(extension) {
    this._schema.CAUTION_MEGA_DANGER_ZONE_registerExtension?.(extension);
  }

  CAUTION_MEGA_DANGER_ZONE_resourceExtensions(resource) {
    return this._schema.CAUTION_MEGA_DANGER_ZONE_resourceExtensions?.(resource);
  }

  CAUTION_MEGA_DANGER_ZONE_objectExtensions(field, resolvedType) {
    return this._schema.CAUTION_MEGA_DANGER_ZONE_objectExtensions?.(
      field,
      resolvedType,
    );
  }

  CAUTION_MEGA_DANGER_ZONE_arrayExtensions(field) {
    return this._schema.CAUTION_MEGA_DANGER_ZONE_arrayExtensions?.(field);
  }

  CAUTION_MEGA_DANGER_ZONE_hasExtension(extension) {
    return this._schema.CAUTION_MEGA_DANGER_ZONE_hasExtension?.(extension);
  }
}
