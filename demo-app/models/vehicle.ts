// @ts-nocheck -- incremental TS conversion; types will be tightened in follow-up PRs.
import Model from '@ember-data/model';
import { fragment } from '#src/attributes/index.ts';

export default class Vehicle extends Model {
  @fragment('passenger') passenger;
}
