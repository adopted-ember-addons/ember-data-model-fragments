import type { ObjectSchema } from '@warp-drive/core-types/schema/fields';
import type { Type } from '@warp-drive/core-types/symbols';

export const PrefixSchema = {
  type: 'fragment:prefix',
  identity: null,
  fields: [{ kind: 'field', name: 'name' }],
  objectExtensions: ['ember-object', 'fragment'],
} satisfies ObjectSchema;

export interface Prefix {
  id: null;
  name: string;
  [Type]: 'fragment:prefix';
}
