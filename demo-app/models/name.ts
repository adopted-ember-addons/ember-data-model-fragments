import Fragment from '#src/fragment.ts';
import { attr } from '@ember-data/model';
import { fragmentArray, fragmentOwner } from '#src/attributes/index.ts';

export default class Name extends Fragment {
  @attr('string') declare first: string;
  @attr('string') declare last: string;
  @fragmentArray('prefix') declare prefixes: unknown;
  @fragmentOwner() declare person: unknown;

  declare readyWasCalled: boolean;

  ready() {
    this.readyWasCalled = true;
  }
}
