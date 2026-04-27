// @ts-nocheck -- incremental TS conversion; types will be tightened in follow-up PRs.
import Fragment from '#src/fragment.ts';
import { attr } from '@ember-data/model';

export default class Address extends Fragment {
  @attr('string') street;
  @attr('string') city;
  @attr('string') region;
  @attr('string') country;
}
