import Animal from './animal.ts';
import { attr } from '@ember-data/model';

export default class Lion extends Animal {
  @attr('boolean') declare hasManes: boolean;
}
