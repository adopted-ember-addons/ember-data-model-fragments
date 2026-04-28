import Model from '@ember-data/model';
import { fragment } from '#src/attributes/index.ts';

export default class Vehicle extends Model {
  @fragment('passenger') declare passenger: unknown;
}
