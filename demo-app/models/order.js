import Fragment from '#src/fragment.js';
import { attr } from '@ember-data/model';
import { fragment, fragmentArray } from '#src/attributes/index.js';

export default class Order extends Fragment {
  @attr('string') amount;
  @attr('boolean') recurring;
  @fragmentArray('product') products;
  @fragment('product') product;
}
