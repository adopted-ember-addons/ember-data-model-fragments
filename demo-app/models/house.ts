// @ts-nocheck -- incremental TS conversion; types will be tightened in follow-up PRs.
import Fragment from '#src/fragment.ts';
import { attr } from '@ember-data/model';

export default class House extends Fragment {
  @attr('string') name;
  @attr('string') region;
  @attr('boolean') exiled;
}
