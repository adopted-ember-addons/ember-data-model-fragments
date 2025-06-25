/**
 * Used as a helper to setup the relevant parts of an array
 * schema and add extensions etc.
 *
 * @param arrayName The name of the array
 * @returns The schema for an array
 */
export function withArrayDefaults(arrayName: string) {
  return {
    kind: 'array',
    name: arrayName,
    options: {
      arrayExtensions: ['ember-object', 'ember-array-like', 'fragment-array'],
    },
  };
}
