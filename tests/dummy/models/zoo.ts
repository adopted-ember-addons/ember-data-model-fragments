import { type WithLegacy } from '@ember-data/model/migration-support';
import type { Type } from '@warp-drive/core-types/symbols';

import { withLegacy } from '#src/utilities/with-legacy.ts';
import { withFragmentDefaults } from '#src/utilities/with-fragment-defaults.ts';
import type { WithEmberObject } from '@warp-drive/legacy/compat/extensions';

export const ZooSchema = withLegacy({
  type: 'zoo',
  fields: [
    { kind: 'field', name: 'name' },
    { kind: 'field', name: 'city' },
    withFragmentDefaults('animal'),
  ],
});

export type Zoo = WithLegacy<
  WithEmberObject<{
    id: string;
    name: string;
    city: string;
    [Type]: 'zoo';
  }>
>;
