import Fragment from '#src/fragment.ts';
import { attr } from '@ember-data/model';
import { fragment, fragmentArray } from '#src/attributes/index.ts';

export default class Order extends Fragment {
  @attr('string') declare amount: string;
  @attr('boolean') declare recurring: boolean;
  @fragmentArray('product') declare products: unknown;
  @fragment('product') declare product: unknown;
}
