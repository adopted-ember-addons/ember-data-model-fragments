function getType(resource: any) {
  return typeof resource === 'string' ? resource : resource.type;
}

function isFragmentAttribute(meta: any) {
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

function transformFragmentMeta(name: string, meta: any) {
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

function mergedCacheFields(fields: Map<any, any>) {
  const cacheFields = new Map();

  fields.forEach((field, key) => {
    if (field.kind === '@id' || field.kind === '@hash') {
      return;
    }

    cacheFields.set(field.sourceKey || field.name || key, field);
  });

  return cacheFields;
}

export default class FragmentSchemaService {
  store: any;
  _schema: any;

  constructor(store: any, schema: any) {
    this.store = store;
    this._schema = schema;
  }

  _fragmentDefinitionsFor(resource: any) {
    const type = getType(resource);
    const modelClass = this.store.modelFor(type);
    const definitions = Object.create(null);

    modelClass.eachComputedProperty((name: string, meta: any) => {
      if (isFragmentAttribute(meta)) {
        definitions[name] = transformFragmentMeta(name, meta);
      }
    });

    return definitions;
  }

  _mergedFields(resource: any) {
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

  hasResource(resource: any) {
    return this._schema.hasResource(resource);
  }

  hasTrait(type: any) {
    return this._schema.hasTrait(type);
  }

  resourceHasTrait(resource: any, trait: any) {
    return this._schema.resourceHasTrait(resource, trait);
  }

  fields(resource: any) {
    return this._mergedFields(resource);
  }

  cacheFields(resource: any) {
    return mergedCacheFields(this._mergedFields(resource));
  }

  transformation(field: any) {
    return this._schema.transformation(field);
  }

  hashFn(field: any) {
    return this._schema.hashFn(field);
  }

  derivation(field: any) {
    return this._schema.derivation(field);
  }

  resource(resource: any) {
    const schema = this._schema.resource(resource);
    const fields = this._mergedFields(resource);

    return {
      ...schema,
      fields: Array.from(fields.values()),
      cacheFields: mergedCacheFields(fields),
    };
  }

  registerResources(schemas: any) {
    this._schema.registerResources(schemas);
  }

  registerResource(schema: any) {
    this._schema.registerResource(schema);
  }

  registerTransformation(transform: any) {
    this._schema.registerTransformation(transform);
  }

  registerDerivation(derivation: any) {
    this._schema.registerDerivation(derivation);
  }

  registerHashFn(hashFn: any) {
    this._schema.registerHashFn(hashFn);
  }

  registerTrait(trait: any) {
    this._schema.registerTrait?.(trait);
  }

  attributesDefinitionFor(resource: any) {
    const attributes = this._schema.attributesDefinitionFor
      ? { ...this._schema.attributesDefinitionFor(resource) }
      : Object.create(null);
    const fragments = this._fragmentDefinitionsFor(resource);

    return Object.assign(attributes, fragments);
  }

  relationshipsDefinitionFor(resource: any) {
    return this._schema.relationshipsDefinitionFor?.(resource);
  }

  doesTypeExist(type: any) {
    return this._schema.doesTypeExist?.(type) ?? this.hasResource({ type });
  }

  CAUTION_MEGA_DANGER_ZONE_registerExtension(extension: any) {
    this._schema.CAUTION_MEGA_DANGER_ZONE_registerExtension?.(extension);
  }

  CAUTION_MEGA_DANGER_ZONE_resourceExtensions(resource: any) {
    return this._schema.CAUTION_MEGA_DANGER_ZONE_resourceExtensions?.(resource);
  }

  CAUTION_MEGA_DANGER_ZONE_objectExtensions(field: any, resolvedType: any) {
    return this._schema.CAUTION_MEGA_DANGER_ZONE_objectExtensions?.(
      field,
      resolvedType,
    );
  }

  CAUTION_MEGA_DANGER_ZONE_arrayExtensions(field: any) {
    return this._schema.CAUTION_MEGA_DANGER_ZONE_arrayExtensions?.(field);
  }

  CAUTION_MEGA_DANGER_ZONE_hasExtension(extension: any) {
    return this._schema.CAUTION_MEGA_DANGER_ZONE_hasExtension?.(extension);
  }
}
