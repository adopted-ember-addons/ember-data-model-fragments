import DS from 'ember-data';
import MF from 'model-fragments';

export default DS.Model.extend({
  title: DS.attr('string'),
  nickName: DS.attr('string'),
  name: MF.fragment('name'),
  names: MF.fragmentArray('name'),
  addresses: MF.fragmentArray('address'),
  titles: MF.array(),
  hobbies: MF.fragmentArray('hobby', { defaultValue: null }),
  houses: MF.fragmentArray('house'),
  children: MF.array(),
  strings: MF.array('string'),
  numbers: MF.array('number'),
  booleans: MF.array('boolean')
});
