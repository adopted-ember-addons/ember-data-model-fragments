import type {
  WithArrayLike,
  WithEmberObject,
} from '@warp-drive/legacy/compat/extensions';

import type { Fragment } from './extensions/fragment';

export type WithFragment<T> = T & WithEmberObject<T> & Fragment;
export type WithFragmentArray<T> = T & WithArrayLike<T> & Fragment;
