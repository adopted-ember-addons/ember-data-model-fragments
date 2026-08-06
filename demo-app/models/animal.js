import Fragment from '#src/fragment.ts';
import { fragmentOwner } from '#src/attributes/index.ts';
import { attr } from '@ember-data/model';

export default class Animal extends Fragment {
  @attr('string') name;
  @fragmentOwner() zoo;
}
