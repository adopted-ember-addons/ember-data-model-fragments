/* eslint-env es6 */
/* eslint parserOptions: { "sourceType": "module" } */
import DS from 'ember-data';
import MF from 'ember-data-model-fragments';

export default MF.Fragment.extend({
  <%= attrs %>
});
