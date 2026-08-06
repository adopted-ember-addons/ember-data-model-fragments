import Model from '@ember-data/model';
import { fragment, fragmentArray } from '#src/attributes/index.ts';

export default class User extends Model {
  @fragment('info') info;
  @fragmentArray('order') orders;
}
