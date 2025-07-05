import { withLegacy } from '#src/utilities/with-legacy.ts';
import { withFragmentDefaults } from '#src/utilities/with-fragment-defaults.ts';
import { withFragmentArrayDefaults } from '#src/utilities/with-fragment-array-defaults.ts';
import { withArrayDefaults } from '#src/utilities/with-array-defaults.ts';

export const PersonSchema = withLegacy({
  type: 'person',
  fields: [
    { kind: 'field', name: 'title' },
    { kind: 'field', name: 'nickName' },
    withFragmentDefaults('name'),
    withFragmentArrayDefaults('addresses'),
    withArrayDefaults('titles'),
  ],
});
