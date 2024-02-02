import Fragment from 'ember-data-model-fragments/fragment';
import { attr } from '@ember-data/model';
import {
  fragmentArray,
  fragmentOwner,
} from 'ember-data-model-fragments/attributes';

export default class Name extends Fragment {
  @attr('string') first;
  @attr('string') last;
  @fragmentArray('prefix') prefixes;
  @fragmentOwner() person;

  ready() {
    this.readyWasCalled = true;
  }
}
