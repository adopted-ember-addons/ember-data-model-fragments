import Fragment from '#src/fragment.ts';
import { fragment } from '#src/attributes/index.ts';
import type Name from './name.ts';

export default class Passenger extends Fragment {
  @fragment('name') declare name: Name;
}
