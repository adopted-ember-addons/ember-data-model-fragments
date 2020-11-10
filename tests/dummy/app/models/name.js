import { attr } from '@ember-data/model';
import MF from 'ember-data-model-fragments';

export default MF.Fragment.extend({
  first: attr('string'),
  last: attr('string'),
  person: MF.fragmentOwner(),

  ready() {
    this.set('readyWasCalled', true);
  }

});

