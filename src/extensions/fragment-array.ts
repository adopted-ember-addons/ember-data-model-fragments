import { cached, tracked } from '@glimmer/tracking';
import type { CAUTION_MEGA_DANGER_ZONE_Extension } from '@warp-drive/core/reactive';

import type { WithFragmentArray } from '../index.js';
import { Fragment } from './fragment.js';

export class FragmentArray<T extends Fragment> {
  // We might want to check the parent values once we move this code to warp-drive.
  @tracked isDestroying = false;
  @tracked isDestroyed = false;

  @cached
  get hasDirtyAttributes() {
    for (const fragment of this as unknown as WithFragmentArray<T>) {
      if (fragment?.hasDirtyAttributes) {
        return true;
      }
    }

    return false;
  }

  addFragment(fragment?: T) {
    if (!fragment) {
      return;
    }

    return (this as unknown as WithFragmentArray<T>).addObject(fragment);
  }

  createFragment(fragment?: T) {
    if (!fragment) {
      return;
    }

    return (this as unknown as WithFragmentArray<T>).pushObject(fragment);
  }

  removeFragment(fragment?: T) {
    if (!fragment) {
      return;
    }

    const index = (this as unknown as WithFragmentArray<T>).indexOf(fragment);

    if (index !== -1) {
      (this as unknown as WithFragmentArray<T>).splice(index, 1);
    }
  }

  rollbackAttributes() {
    for (const fragment of this as unknown as WithFragmentArray<T>) {
      // @ts-expect-error TODO: fix these types
      fragment?.rollbackAttributes?.();
    }
  }
}

export const FragmentArrayExtension = {
  kind: 'array' as const,
  name: 'fragment-array' as const,
  features: FragmentArray,
} satisfies CAUTION_MEGA_DANGER_ZONE_Extension;

export default FragmentArrayExtension;
