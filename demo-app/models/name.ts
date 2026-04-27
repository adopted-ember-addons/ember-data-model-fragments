// @ts-nocheck -- incremental TS conversion; types will be tightened in follow-up PRs.
import Fragment from '#src/fragment.ts';
import { attr } from '@ember-data/model';
import { fragmentArray, fragmentOwner } from '#src/attributes/index.ts';

export default class Name extends Fragment {
  @attr('string') first;
  @attr('string') last;
  @fragmentArray('prefix') prefixes;
  @fragmentOwner() person;

  ready() {
    this.readyWasCalled = true;
  }
}
