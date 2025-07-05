/**
 * Used as a helper to setup the relevant parts of a fragment schema
 * and add extensions etc.
 *
 * @param fragmentName The name of the fragment
 * @returns The schema for a fragment
 */
export function withFragmentDefaults(fragmentName: string) {
  return {
    kind: 'schema-object' as const,
    type: `fragment:${fragmentName}`,
    name: fragmentName,
    options: {
      objectExtensions: ['ember-object', 'fragment'],
    },
  };
}
