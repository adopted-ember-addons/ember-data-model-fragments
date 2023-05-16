import Animal from 'dummy/models/animal';
import { attr } from '@ember-data/model';

export default class Lion extends Animal {
  @attr('boolean') hasManes;
}
