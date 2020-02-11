import { attr } from '@ember-data/model';
import Fragment from 'ember-data-model-fragments/fragment';

export default Fragment.extend({
  name: attr('string')
});
