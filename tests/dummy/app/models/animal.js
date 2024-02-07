import Fragment from 'ember-data-model-fragments/fragment';
import { fragmentOwner } from 'ember-data-model-fragments/attributes';
import { attr } from '@ember-data/model';

export default class Animal extends Fragment {
  @attr('string') name;
  @fragmentOwner() zoo;
}
