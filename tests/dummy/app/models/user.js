import DS from 'ember-data';
import MF from 'model-fragments';

export default DS.Model.extend({
  info: MF.fragment('info'),
  orders: MF.fragmentArray('order')
});

