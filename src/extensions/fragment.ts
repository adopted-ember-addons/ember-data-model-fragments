import type { CAUTION_MEGA_DANGER_ZONE_Extension } from '@warp-drive/core/reactive';

export const FragmentExtension = {
  kind: 'object' as const,
  name: 'fragment' as const,
  features: {
    get isFragment() {
      return true;
    },
  },
} satisfies CAUTION_MEGA_DANGER_ZONE_Extension;

export default FragmentExtension;
