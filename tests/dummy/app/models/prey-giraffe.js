import DS from 'ember-data';
import Prey from 'dummy/models/prey';

export default Prey.extend({
  neckLength: DS.attr('string')
});
