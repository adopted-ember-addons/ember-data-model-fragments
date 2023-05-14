import Model, { attr } from '@ember-data/model';
import MF from 'ember-data-model-fragments';

export default Model.extend({
  title: attr('string'),
  nickName: attr('string'),
  name: MF.fragment('name'),
  names: MF.fragmentArray('name'),
  addresses: MF.fragmentArray('address'),
  titles: MF.array(),
  hobbies: MF.fragmentArray('hobby', { defaultValue: null }),
  houses: MF.fragmentArray('house'),
  children: MF.array(),
  strings: MF.array('string'),
  numbers: MF.array('number'),
  booleans: MF.array('boolean'),
});
