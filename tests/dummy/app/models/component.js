import Model, { attr } from '@ember-data/model';
import { fragment } from 'ember-data-model-fragments/attributes';

export default class Component extends Model {
  @attr('string') type;
  @fragment('component-options', {
    polymorphic: true,
    typeKey: (data, owner) => `component-options-${owner.type}`,
  })
  options;
}
