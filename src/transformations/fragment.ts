import type { Transformation } from '@warp-drive/schema-record';
import { Type } from '@warp-drive/core-types/symbols';

import Fragment from '../fragment.ts';

const FragmentTransformation: Transformation<object, Fragment> = {
  serialize(value: Fragment): string {
    return value.getPOJO();
  },
  hydrate(value: object): Fragment {
    return new Fragment(value);
  },
  [Type]: 'fragment',
};

export default FragmentTransformation;
