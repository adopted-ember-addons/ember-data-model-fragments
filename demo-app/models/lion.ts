// @ts-nocheck -- incremental TS conversion; types will be tightened in follow-up PRs.
import Animal from './animal.ts';
import { attr } from '@ember-data/model';

export default class Lion extends Animal {
  @attr('boolean') hasManes;
}
