import Fragment from '#src/fragment.ts';
import { attr } from '@ember-data/model';

export default class House extends Fragment {
  @attr('string') declare name: string;
  @attr('string') declare region: string;
  @attr('boolean') declare exiled: boolean;
}
