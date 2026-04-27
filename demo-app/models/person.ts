// @ts-nocheck -- incremental TS conversion; types will be tightened in follow-up PRs.
import Model, { attr } from '@ember-data/model';
import { fragment, fragmentArray, array } from '#src/attributes/index.ts';

export default class Person extends Model {
  @attr('string') title;
  @attr('string') nickName;
  @fragment('name') name;
  @fragmentArray('name') names;
  @fragmentArray('address') addresses;
  @array() titles;
  @fragmentArray('hobby', { defaultValue: null }) hobbies;
  @fragmentArray('house') houses;
  @array() children;
  @array('string') strings;
  @array('number') numbers;
  @array('boolean') booleans;
}
