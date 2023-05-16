import Fragment from 'ember-data-model-fragments/fragment';
import { attr } from '@ember-data/model';

export default class Prefix extends Fragment {
  @attr('string') name;
}
