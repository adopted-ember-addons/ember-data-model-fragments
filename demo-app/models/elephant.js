import Animal from './animal.js';
import { attr } from '@ember-data/model';

export default class Elephant extends Animal {
  @attr('number') trunkLength;
}
