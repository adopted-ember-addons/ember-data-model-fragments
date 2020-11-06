import { attr } from '@ember-data/model';
import Animal from 'dummy/models/animal';

export default Animal.extend({
  trunkLength: attr('number')
});
