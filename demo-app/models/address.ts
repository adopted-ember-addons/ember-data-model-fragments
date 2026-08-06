import Fragment from '#src/fragment.ts';
import { attr } from '@ember-data/model';

export default class Address extends Fragment {
  @attr('string') declare street: string;
  @attr('string') declare city: string;
  @attr('string') declare region: string;
  @attr('string') declare country: string;
}
