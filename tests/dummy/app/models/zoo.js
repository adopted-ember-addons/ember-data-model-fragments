import Model, { attr, belongsTo } from '@ember-data/model';
import MF from 'ember-data-model-fragments';

export default Model.extend({
  name: attr('string'),
  city: attr('string'),
  star: MF.fragment('animal', { polymorphic: true, typeKey: '$type' }),
  animals: MF.fragmentArray('animal', { polymorphic: true, typeKey: '$type' }),
  manager: belongsTo('person'),
});
