import Fragment from 'ember-data-model-fragments/fragment';
import { attr } from '@ember-data/model';
import { array } from 'ember-data-model-fragments/attributes';

export default class Info extends Fragment {
  @attr('string') name;
  @array() notes;
}
