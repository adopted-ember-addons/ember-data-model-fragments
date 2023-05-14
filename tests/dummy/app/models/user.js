import Model from '@ember-data/model';
import MF from 'ember-data-model-fragments';

export default Model.extend({
  info: MF.fragment('info'),
  orders: MF.fragmentArray('order'),
});
