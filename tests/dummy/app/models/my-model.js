import Model, { attr } from '@ember-data/model';
import { fragmentArray } from 'ember-data-model-fragments/attributes';

export default Model.extend({
  name: attr('string'),
  fragments: fragmentArray('my-fragment')
});
