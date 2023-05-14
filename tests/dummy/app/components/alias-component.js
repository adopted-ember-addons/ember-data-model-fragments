import { alias } from '@ember/object/computed';
import Component from '@ember/component';

export default Component.extend({
  model: null,

  firstAlias: alias('model.passenger'),
  secondAlias: alias('firstAlias.name'),
});
