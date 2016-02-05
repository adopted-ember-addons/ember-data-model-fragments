import DS from 'ember-data';
import MF from 'ember-data-model-fragments';

export default DS.Model.extend({
  title: DS.attr('string'),
  name: MF.fragment('name'),
  addresses: MF.fragmentArray('address'),
  titles: MF.array(),
  hobbies: MF.fragmentArray('hobby', { defaultValue: null })
});
