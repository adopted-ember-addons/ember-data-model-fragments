import type { ObjectSchema } from '@warp-drive/core-types/schema/fields';

export const PrefixSchema = {
  type: 'fragment:prefix',
  identity: null,
  fields: [{ kind: 'field', name: 'name' }],
  objectExtensions: ['ember-object', 'fragment'],
} satisfies ObjectSchema;
