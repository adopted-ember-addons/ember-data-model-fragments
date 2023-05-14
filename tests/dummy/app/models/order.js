import Fragment from 'ember-data-model-fragments/fragment';
import { attr } from '@ember-data/model';
import { fragment, fragmentArray } from 'ember-data-model-fragments/attributes';

export default class Order extends Fragment {
  @attr('string') amount;
  @attr('boolean') recurring;
  @fragmentArray('product') products;
  @fragment('product') product;
}
