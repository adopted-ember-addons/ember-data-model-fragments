import type { ObjectSchema } from '@warp-drive/core-types/schema/fields';

import { withFragmentArrayDefaults } from '#src/utilities/with-fragment-array-defaults.ts';

export const NameSchema = {
  type: 'fragment:name',
  identity: null,
  fields: [
    { kind: 'field', name: 'first' },
    { kind: 'field', name: 'last' },
    withFragmentArrayDefaults('prefixes'),
  ],
  objectExtensions: ['ember-object', 'fragment'],
} satisfies ObjectSchema;
