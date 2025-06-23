import type { Transformation } from '@warp-drive/schema-record';
import { Type } from '@warp-drive/core-types/symbols';

import FragmentArray from '../fragment-array.ts';

const FragmentArrayTransformation: Transformation<object, FragmentArray> = {
  serialize(value: FragmentArray): string {
    return value.getArray();
  },
  hydrate(value: object): FragmentArray {
    return new FragmentArray(value);
  },
  [Type]: 'fragment-array',
};

export default FragmentArrayTransformation;
