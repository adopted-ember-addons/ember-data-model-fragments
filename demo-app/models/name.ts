import Fragment from '#src/fragment.ts';
import { attr } from '@ember-data/model';
import { fragmentArray, fragmentOwner } from '#src/attributes/index.ts';
import type { FragmentArray } from '#src/array/fragment.ts';
import type Person from './person.ts';
import type Prefix from './prefix.ts';

export default class Name extends Fragment {
  @attr('string') declare first: string;
  @attr('string') declare last: string;
  @fragmentArray('prefix') declare prefixes: FragmentArray<Prefix>;
  @fragmentOwner() declare person: Person;

  readyWasCalled?: boolean;

  ready() {
    this.readyWasCalled = true;
  }
}
