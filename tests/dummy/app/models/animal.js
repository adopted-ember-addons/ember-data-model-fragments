import Fragment from 'ember-data-model-fragments/fragment';
import { attr } from '@ember-data/model';

export default class Animal extends Fragment {
  @attr('string') name;
}
