import Fragment from '#src/fragment.ts';
import { attr } from '@ember-data/model';
import { array } from '#src/attributes/index.ts';

export default class Info extends Fragment {
  @attr('string') name;
  @array() notes;
}
