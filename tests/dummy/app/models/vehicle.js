import Model from '@ember-data/model';
import MF from 'ember-data-model-fragments';

export default Model.extend({
  passenger: MF.fragment('passenger'),
});
