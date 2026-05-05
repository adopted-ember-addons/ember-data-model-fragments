import Model from '@ember-data/model';
import { fragment, fragmentArray } from '#src/attributes/index.ts';

export default class User extends Model {
  @fragment('info') declare info: unknown;
  @fragmentArray('order') declare orders: unknown;
}
