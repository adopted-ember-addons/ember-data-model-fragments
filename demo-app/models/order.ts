import Fragment from '#src/fragment.ts';
import { attr } from '@ember-data/model';
import { fragment, fragmentArray } from '#src/attributes/index.ts';
import type { FragmentArray } from '#src/array/fragment.ts';
import type Product from './product.ts';

export default class Order extends Fragment {
  @attr('string') declare amount: string;
  @attr('boolean') declare recurring: boolean;
  @fragmentArray('product') declare products: FragmentArray<Product>;
  @fragment('product') declare product: Product;
}
