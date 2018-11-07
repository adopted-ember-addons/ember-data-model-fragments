import DS from 'ember-data';
import Animal from 'dummy/models/animal';
import MF from 'ember-data-model-fragments';

export default Animal.extend({
  hasManes: DS.attr('boolean'),
  preys: MF.fragmentArray('prey', { polymorphic: true, typeKey: '$type' })
});
