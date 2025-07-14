import { singularize, pluralize } from 'ember-inflector';
/**
 * Used as a helper to setup the relevant parts of a fragment-array
 * schema and add extensions etc.
 *
 * @param fragmentArrayType The type of the fragment-array
 * @param fragmentArrayName The name of the fragment-array
 * @returns The schema for a fragment-array
 */
export function withFragmentArrayDefaults(
  fragmentArrayType: string,
  fragmentArrayName?: string,
) {
  return {
    kind: 'schema-array' as const,
    type: `fragment:${singularize(fragmentArrayType)}`,
    name: fragmentArrayName ?? pluralize(fragmentArrayType),
    options: {
      arrayExtensions: ['ember-object', 'ember-array-like', 'fragment-array'],
      defaultValue: true,
    },
  };
}
