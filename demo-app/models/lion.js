import Animal from './animal.js';
import { attr } from '@ember-data/model';

export default class Lion extends Animal {
  @attr('boolean') hasManes;
}
