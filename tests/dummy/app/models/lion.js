import DS from 'ember-data';
import Animal from 'dummy/models/animal';

export default Animal.extend({
  hasManes: DS.attr('boolean')
});
