import Fragment from '#src/fragment.ts';
import { fragment } from '#src/attributes/index.ts';

export default class Passenger extends Fragment {
  @fragment('name') declare name: unknown;
}
