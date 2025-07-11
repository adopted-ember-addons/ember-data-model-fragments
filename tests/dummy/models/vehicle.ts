import type { Type } from '@warp-drive/core-types/symbols';
import { withLegacy } from '#src/utilities/with-legacy.ts';
import { withFragmentDefaults } from '#src/utilities/with-fragment-defaults.ts';
import type { Name } from './name';

export const VehicleSchema = withLegacy({
  type: 'vehicle',
  fields: [withFragmentDefaults('passenger')],
});

export interface Vehicle {
  id: string;
  name: Name | null;
  [Type]: 'vehicle';
}
