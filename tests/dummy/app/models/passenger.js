import Fragment from 'ember-data-model-fragments/fragment';
import { fragment } from 'ember-data-model-fragments/attributes';

export default class Passenger extends Fragment {
  @fragment('name') name;
}
