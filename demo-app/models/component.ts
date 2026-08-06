import Model, { attr } from '@ember-data/model';
import { fragment, fragmentArray } from '#src/attributes/index.ts';
import type { FragmentArray } from '#src/array/fragment.ts';
import type ComponentOptions from './component-options.ts';

export default class Component extends Model {
  @attr('string') declare name: string;
  @attr('string') declare type: string;

  @fragment('component-options', {
    polymorphic: true,
    typeKey: (data, owner) => `component-options-${(owner as Component).type}`,
  })
  declare options: ComponentOptions;

  @fragmentArray('component-options', {
    polymorphic: true,
    typeKey: (data, owner) => `component-options-${(owner as Component).type}`,
  })
  declare optionsHistory: FragmentArray<ComponentOptions>;
}
