import type Store from '@ember-data/store';
export default class FragmentSchemaService {
    store: Store;
    _schema: any;
    constructor(store: Store, schema: any);
    _fragmentDefinitionsFor(resource: any): Record<string, any>;
    _mergedFields(resource: any): Map<string, any>;
    resourceTypes(): unknown;
    hasResource(resource: any): boolean;
    hasTrait(type: any): boolean;
    resourceHasTrait(resource: any, trait: any): boolean;
    fields(resource: any): Map<string, any>;
    cacheFields(resource: any): Map<string, any>;
    transformation(field: any): unknown;
    hashFn(field: any): unknown;
    derivation(field: any): unknown;
    resource(resource: any): any;
    registerResources(schemas: any): void;
    registerResource(schema: any): void;
    registerTransformation(transform: any): void;
    registerDerivation(derivation: any): void;
    registerHashFn(hashFn: any): void;
    registerTrait(trait: any): void;
    attributesDefinitionFor(resource: any): Record<string, any>;
    relationshipsDefinitionFor(resource: any): unknown;
    doesTypeExist(type: string): boolean;
    CAUTION_MEGA_DANGER_ZONE_registerExtension(extension: any): void;
    CAUTION_MEGA_DANGER_ZONE_resourceExtensions(resource: any): unknown;
    CAUTION_MEGA_DANGER_ZONE_objectExtensions(field: any, resolvedType: any): unknown;
    CAUTION_MEGA_DANGER_ZONE_arrayExtensions(field: any): unknown;
    CAUTION_MEGA_DANGER_ZONE_hasExtension(extension: any): unknown;
}
//# sourceMappingURL=schema-service.d.ts.map