import { attr } from '@ember-data/model';
import titleDescription from './title-description';

export default titleDescription.extend({
  responsability: attr('string')
});
