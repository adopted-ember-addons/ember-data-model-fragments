import Model, { attr } from '@ember-data/model';
import { fragment, fragmentArray, array } from '#src/attributes/index.ts';
import type { FragmentArray } from '#src/array/fragment.ts';
import type { StatefulArray } from '#src/array/stateful.ts';
import type Address from './address.ts';
import type Hobby from './hobby.ts';
import type House from './house.ts';
import type Name from './name.ts';

export default class Person extends Model {
  @attr('string') declare title: string;
  @attr('string') declare nickName: string;
  @fragment('name') declare name: Name;
  @fragmentArray('name') declare names: FragmentArray<Name>;
  @fragmentArray('address') declare addresses: FragmentArray<Address>;
  @array() declare titles: StatefulArray;
  @fragmentArray('hobby', { defaultValue: null })
  declare hobbies: FragmentArray<Hobby> | null;
  @fragmentArray('house') declare houses: FragmentArray<House>;
  @array() declare children: StatefulArray;
  @array('string') declare strings: StatefulArray<string>;
  @array('number') declare numbers: StatefulArray<number>;
  @array('boolean') declare booleans: StatefulArray<boolean>;
}
