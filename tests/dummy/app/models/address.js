import { attr } from '@ember-data/model';
import MF from 'ember-data-model-fragments';

export default MF.Fragment.extend({
  street: attr('string'),
  city: attr('string'),
  region: attr('string'),
  country: attr('string')
});
