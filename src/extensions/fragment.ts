// @ts-expect-error TODO: fix this import when it is ready
import { type CAUTION_MEGA_DANGER_ZONE_Extension } from '@warp-drive/schema-record';

export const FragmentExtension = {
  kind: 'object',
  name: 'fragment' as const,
  features: {
    isFragment() {
      return true;
    },
  },
} satisfies CAUTION_MEGA_DANGER_ZONE_Extension;

export default FragmentExtension;
