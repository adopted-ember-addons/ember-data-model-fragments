// @ts-nocheck -- incremental TS conversion; types will be tightened in follow-up PRs.
import Fragment from '#src/fragment.ts';
import { attr } from '@ember-data/model';
import { fragment, fragmentArray } from '#src/attributes/index.ts';

export default class Order extends Fragment {
  @attr('string') amount;
  @attr('boolean') recurring;
  @fragmentArray('product') products;
  @fragment('product') product;
}
