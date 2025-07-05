import { singularize } from 'ember-inflector';
/**
 * Used as a helper to setup the relevant parts of a fragment-array
 * schema and add extensions etc.
 *
 * @param fragmentArrayName The name of the fragment-array
 * @returns The schema for a fragment-array
 */
export function withFragmentArrayDefaults(fragmentArrayName: string) {
  return {
    kind: 'schema-array' as const,
    type: `fragment:${singularize(fragmentArrayName)}`,
    name: fragmentArrayName,
    options: {
      arrayExtensions: ['ember-object', 'ember-array-like', 'fragment-array'],
    },
  };
}
