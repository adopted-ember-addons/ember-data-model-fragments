import Fragment from 'ember-data-model-fragments/fragment';
import { attr } from '@ember-data/model';

export default class House extends Fragment {
  @attr('string') name;
  @attr('string') region;
  @attr('boolean') exiled;
}
