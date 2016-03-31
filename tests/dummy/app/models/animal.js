import DS from 'ember-data';
import MF from 'model-fragments';

export default MF.Fragment.extend({
  name: DS.attr('string')
});
