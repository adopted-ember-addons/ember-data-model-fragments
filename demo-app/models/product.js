import Fragment from '#src/fragment.ts';
import { attr } from '@ember-data/model';

export default class Product extends Fragment {
  @attr('string') name;
  @attr('string') sku;
  @attr('string') price;
}
