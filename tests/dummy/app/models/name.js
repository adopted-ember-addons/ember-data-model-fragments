import MF from 'model-fragments';
import DS from 'ember-data';

export default MF.Fragment.extend({
  first: DS.attr('string'),
  last: DS.attr('string'),
  person: MF.fragmentOwner()
});

