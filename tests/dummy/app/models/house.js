import MF from 'model-fragments';
import DS from 'ember-data';

export default MF.Fragment.extend({
  name: DS.attr('string'),
  region: DS.attr('string'),
  exiled: DS.attr('boolean')
});
