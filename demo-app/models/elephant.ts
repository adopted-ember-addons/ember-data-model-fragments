import Animal from './animal.ts';
import { attr } from '@ember-data/model';

export default class Elephant extends Animal {
  @attr('number') declare trunkLength: number;
}
