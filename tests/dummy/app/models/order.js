import MF from 'ember-data-model-fragments';
import DS from 'ember-data';

export default MF.Fragment.extend({
  amount: DS.attr('string'),
  recurring: DS.attr('boolean'),
  products: MF.fragmentArray('product'),
  product: MF.fragment('product')
});
