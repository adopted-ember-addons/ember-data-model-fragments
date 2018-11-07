import DS from 'ember-data';
import Prey from 'dummy/models/prey';

export default Prey.extend({
  stripesColour: DS.attr('string')
});
