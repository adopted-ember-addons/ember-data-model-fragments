import Model, { attr } from '@ember-data/model';
import { fragment, fragmentArray } from '#src/attributes/index.ts';

export default class Component extends Model {
  @attr('string') declare name: string;
  @attr('string') declare type: string;
  @fragment('component-options', {
    polymorphic: true,
    typeKey: (data: unknown, owner: Component) =>
      `component-options-${owner.type}`,
  })
  declare options: unknown;

  @fragmentArray('component-options', {
    polymorphic: true,
    typeKey: (data: unknown, owner: Component) =>
      `component-options-${owner.type}`,
  })
  declare optionsHistory: unknown;
}
