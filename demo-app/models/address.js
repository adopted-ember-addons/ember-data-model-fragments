import Fragment from '#src/fragment.js';
import { attr } from '@ember-data/model';

export default class Address extends Fragment {
  @attr('string') street;
  @attr('string') city;
  @attr('string') region;
  @attr('string') country;
}
