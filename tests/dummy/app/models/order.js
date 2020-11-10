import { attr } from '@ember-data/model';
import MF from 'ember-data-model-fragments';

export default MF.Fragment.extend({
  amount: attr('string'),
  recurring: attr('boolean'),
  products: MF.fragmentArray('product'),
  product: MF.fragment('product')
});
