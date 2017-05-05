import DS from 'ember-data';
import MF from 'ember-data-model-fragments';

export default DS.Model.extend({
  name: DS.attr('string'),
  city: DS.attr('string'),
  star: MF.fragment('animal', { polymorphic: true, typeKey: '$type' }),
  animals: MF.fragmentArray('animal', { polymorphic: true, typeKey: '$type' }),
  manager: DS.belongsTo('person')
});
