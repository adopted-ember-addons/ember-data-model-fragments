import { withDefaults } from '@ember-data/model/migration-support';
import type { WithPartial } from '@warp-drive/core-types/utils';
import type { LegacyResourceSchema } from '@warp-drive/core-types/schema/fields';

export function withFragmentDefaults(
  schema: WithPartial<LegacyResourceSchema, 'legacy' | 'identity'>,
) {
  return withDefaults({ ...schema });
}
