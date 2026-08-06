import Fragment from '#src/fragment.ts';
import { attr } from '@ember-data/model';

export default class Product extends Fragment {
  @attr('string') declare name: string;
  @attr('string') declare sku: string;
  @attr('string') declare price: string;
}
