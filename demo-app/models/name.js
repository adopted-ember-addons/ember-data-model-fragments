import Fragment from '#src/fragment.js';
import { attr } from '@ember-data/model';
import {
  fragmentArray,
  fragmentOwner,
} from '#src/attributes/index.js';

export default class Name extends Fragment {
  @attr('string') first;
  @attr('string') last;
  @fragmentArray('prefix') prefixes;
  @fragmentOwner() person;

  ready() {
    this.readyWasCalled = true;
  }
}
