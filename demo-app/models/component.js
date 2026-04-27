import Model, { attr } from '@ember-data/model';
import { fragment, fragmentArray } from '#src/attributes/index.js';

export default class Component extends Model {
  @attr('string') name;
  @attr('string') type;
  @fragment('component-options', {
    polymorphic: true,
    typeKey: (data, owner) => `component-options-${owner.type}`,
  })
  options;

  @fragmentArray('component-options', {
    polymorphic: true,
    typeKey: (data, owner) => `component-options-${owner.type}`,
  })
  optionsHistory;
}
