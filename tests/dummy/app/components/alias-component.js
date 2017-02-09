import Ember from 'ember';

export default Ember.Component.extend({
  model: null,

  firstAlias: Ember.computed.alias('model.passenger'),
  secondAlias: Ember.computed.alias('firstAlias.name')
});
