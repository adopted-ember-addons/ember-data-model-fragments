import { withLegacy } from '#src/utilities/with-legacy.ts';
import { withFragmentDefaults } from '#src/utilities/with-fragment-defaults.ts';

export const VehicleSchema = withLegacy({
  type: 'vehicle',
  fields: [withFragmentDefaults('passenger')],
});
