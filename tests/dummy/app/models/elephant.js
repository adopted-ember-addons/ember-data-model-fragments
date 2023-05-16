import Animal from 'dummy/models/animal';
import { attr } from '@ember-data/model';

export default class Elephant extends Animal {
  @attr('number') trunkLength;
}
