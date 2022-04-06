import Model, { attr } from '@ember-data/model';
import MF from 'ember-data-model-fragments';

const fragment = MF.fragment;

export default class Component extends Model {
  @attr('string') type;
  @fragment('component-options', { polymorphic: true, typeKey: (data, owner) => `component-options-${owner.type}` }) options;
}
