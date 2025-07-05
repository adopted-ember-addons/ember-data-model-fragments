import type { ObjectSchema } from '@warp-drive/core-types/schema/fields';

import { withFragmentDefaults } from '#src/utilities/with-fragment-defaults.ts';

export const PassengerSchema = {
  type: 'fragment:passenger',
  identity: null,
  fields: [withFragmentDefaults('name')],
  objectExtensions: ['ember-object', 'fragment'],
} satisfies ObjectSchema;
