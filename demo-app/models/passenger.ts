// @ts-nocheck -- incremental TS conversion; types will be tightened in follow-up PRs.
import Fragment from '#src/fragment.ts';
import { fragment } from '#src/attributes/index.ts';

export default class Passenger extends Fragment {
  @fragment('name') name;
}
