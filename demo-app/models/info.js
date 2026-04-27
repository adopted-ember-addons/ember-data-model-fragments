import Fragment from '#src/fragment.js';
import { attr } from '@ember-data/model';
import { array } from '#src/attributes/index.js';

export default class Info extends Fragment {
  @attr('string') name;
  @array() notes;
}
