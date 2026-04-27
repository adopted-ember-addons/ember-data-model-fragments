import Fragment from '#src/fragment.js';
import { fragmentOwner } from '#src/attributes/index.js';
import { attr } from '@ember-data/model';

export default class Animal extends Fragment {
  @attr('string') name;
  @fragmentOwner() zoo;
}
