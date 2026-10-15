/**
 * Re-exports for ember-data-model-fragments serializers.
 *
 * Usage:
 *
 * ```js
 * // For JSONSerializer (default)
 * import FragmentSerializer from 'ember-data-model-fragments/serializer';
 *
 * // For RESTSerializer
 * import { FragmentRESTSerializer } from 'ember-data-model-fragments/serializer';
 *
 * // For JSONAPISerializer
 * import { FragmentJSONAPISerializer } from 'ember-data-model-fragments/serializer';
 * ```
 */

export { default } from './serializers/fragment.ts';
export { default as FragmentSerializer } from './serializers/fragment.ts';
export { default as FragmentRESTSerializer } from './serializers/rest.ts';
export { default as FragmentJSONAPISerializer } from './serializers/json-api.ts';
