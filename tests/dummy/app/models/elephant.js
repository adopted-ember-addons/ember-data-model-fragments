import DS from 'ember-data';
import Animal from 'dummy/models/animal';

export default Animal.extend({
  trunkLength: DS.attr('number')
});
