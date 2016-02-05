import MF from 'ember-data-model-fragments';
import DS from 'ember-data';

export default MF.Fragment.extend({
  amount: DS.attr('string'),
  products: MF.fragmentArray('product')
});
