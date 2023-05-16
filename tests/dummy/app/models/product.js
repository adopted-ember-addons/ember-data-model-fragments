import Fragment from 'ember-data-model-fragments/fragment';
import { attr } from '@ember-data/model';

export default class Product extends Fragment {
  @attr('string') name;
  @attr('string') sku;
  @attr('string') price;
}
