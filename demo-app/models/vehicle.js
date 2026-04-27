import Model from '@ember-data/model';
import { fragment } from '#src/attributes/index.js';

export default class Vehicle extends Model {
  @fragment('passenger') passenger;
}
