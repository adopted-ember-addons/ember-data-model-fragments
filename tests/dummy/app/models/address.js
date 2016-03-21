import MF from 'model-fragments';
import DS from 'ember-data';

export default MF.Fragment.extend({
  street: DS.attr('string'),
  city: DS.attr('string'),
  region: DS.attr('string'),
  country: DS.attr('string')
});
