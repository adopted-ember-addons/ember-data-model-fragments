import { Context } from '@warp-drive/schema-record/-private';
import { recordIdentifierFor, storeFor } from '@ember-data/store';
import { tracked } from '@glimmer/tracking';
import type { StableRecordIdentifier } from '@warp-drive/core-types';
import type { CAUTION_MEGA_DANGER_ZONE_Extension } from '@warp-drive/core/reactive';
import type { SchemaRecord } from '@warp-drive/schema-record';
import type { Value } from '@warp-drive/core-types/json/raw';

export class Fragment {
  // We might want to check the parent values once we move this code to warp-drive.
  @tracked isDestroying = false;
  @tracked isDestroyed = false;

  get isFragment() {
    return true;
  }

  rollbackAttributes(this: SchemaRecord) {
    const { path, resourceKey, store } = this[Context];

    if (path) {
      const oldValue = store.cache.getRemoteAttr(resourceKey, path) as Value;
      store.cache.setAttr(resourceKey, path, oldValue);
    }
  }
}

export const FragmentExtension = {
  kind: 'object' as const,
  name: 'fragment' as const,
  features: Fragment,
} satisfies CAUTION_MEGA_DANGER_ZONE_Extension;

export default FragmentExtension;
