import Model from '@ember-data/model';
import { fragment, fragmentArray } from '#src/attributes/index.ts';
import type { FragmentArray } from '#src/array/fragment.ts';
import type Info from './info.ts';
import type Order from './order.ts';

export default class User extends Model {
  @fragment('info') declare info: Info;
  @fragmentArray('order') declare orders: FragmentArray<Order>;
}
