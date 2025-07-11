import type { CAUTION_MEGA_DANGER_ZONE_Extension } from '@warp-drive/core/reactive';
import { Fragment } from './fragment.js';

export const FragmentArrayExtension = {
  kind: 'array' as const,
  name: 'fragment-array' as const,
  features: Fragment,
} satisfies CAUTION_MEGA_DANGER_ZONE_Extension;

export default FragmentArrayExtension;
