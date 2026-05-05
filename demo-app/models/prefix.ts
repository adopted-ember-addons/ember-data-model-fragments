import Fragment from '#src/fragment.ts';
import { attr } from '@ember-data/model';

export default class Prefix extends Fragment {
  @attr('string') declare name: string;
}
