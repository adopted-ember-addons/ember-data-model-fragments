import Model, { attr } from '@ember-data/model';
import { fragment, fragmentArray, array } from '#src/attributes/index.ts';

export default class Person extends Model {
  @attr('string') declare title: string;
  @attr('string') declare nickName: string;
  @fragment('name') declare name: unknown;
  @fragmentArray('name') declare names: unknown;
  @fragmentArray('address') declare addresses: unknown;
  @array() declare titles: unknown;
  @fragmentArray('hobby', { defaultValue: null }) declare hobbies: unknown;
  @fragmentArray('house') declare houses: unknown;
  @array() declare children: unknown;
  @array('string') declare strings: unknown;
  @array('number') declare numbers: unknown;
  @array('boolean') declare booleans: unknown;
}
