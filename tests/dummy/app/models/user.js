import Model from '@ember-data/model';
import { fragment, fragmentArray } from 'ember-data-model-fragments/attributes';

export default class User extends Model {
  @fragment('info') info;
  @fragmentArray('order') orders;
}
