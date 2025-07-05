import { withLegacy } from '#src/utilities/with-legacy.ts';
import { withFragmentDefaults } from '#src/utilities/with-fragment-defaults.ts';

export const ZooSchema = withLegacy({
  type: 'zoo',
  fields: [
    { kind: 'field', name: 'name' },
    { kind: 'field', name: 'city' },
    withFragmentDefaults('animal'),
  ],
});
