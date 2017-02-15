import DS from 'ember-data';
import MF from 'ember-data-model-fragments';

export default DS.Model.extend({
  passenger: MF.fragment('passenger')
});
