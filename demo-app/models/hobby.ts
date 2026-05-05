import Fragment from '#src/fragment.ts';
import { attr } from '@ember-data/model';

export default class Hobby extends Fragment {
  @attr('string') declare name: string;
}
