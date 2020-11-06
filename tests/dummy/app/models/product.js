import { attr } from '@ember-data/model';
import MF from 'ember-data-model-fragments';

export default MF.Fragment.extend({
  name: attr('string'),
  sku: attr('string'),
  price: attr('string')
});
