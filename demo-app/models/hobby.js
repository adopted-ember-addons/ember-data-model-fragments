import Fragment from '#src/fragment.js';
import { attr } from '@ember-data/model';

export default class Hobby extends Fragment {
  @attr('string') name;
}
