import type { CAUTION_MEGA_DANGER_ZONE_Extension } from '@warp-drive/core/reactive';

export const FragmentArrayExtension = {
  kind: 'array' as const,
  name: 'fragment-array' as const,
  features: {
    isFragment() {
      return true;
    },
  },
} satisfies CAUTION_MEGA_DANGER_ZONE_Extension;

export default FragmentArrayExtension;
