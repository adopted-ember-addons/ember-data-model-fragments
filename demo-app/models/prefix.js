import Fragment from '#src/fragment.js';
import { attr } from '@ember-data/model';

export default class Prefix extends Fragment {
  @attr('string') name;
}
