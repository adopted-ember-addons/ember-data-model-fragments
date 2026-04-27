import Fragment from '#src/fragment.js';
import { fragment } from '#src/attributes/index.js';

export default class Passenger extends Fragment {
  @fragment('name') name;
}
