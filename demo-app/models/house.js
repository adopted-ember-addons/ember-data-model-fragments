import Fragment from '#src/fragment.js';
import { attr } from '@ember-data/model';

export default class House extends Fragment {
  @attr('string') name;
  @attr('string') region;
  @attr('boolean') exiled;
}
