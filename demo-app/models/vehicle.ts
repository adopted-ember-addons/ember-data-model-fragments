import Model from '@ember-data/model';
import { fragment } from '#src/attributes/index.ts';
import type Passenger from './passenger.ts';

export default class Vehicle extends Model {
  @fragment('passenger') declare passenger: Passenger;
}
