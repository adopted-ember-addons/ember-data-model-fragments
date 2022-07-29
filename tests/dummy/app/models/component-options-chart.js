import ComponentOptions from './component-options';
import MF from 'ember-data-model-fragments';

export default class ComponentOptionsChart extends ComponentOptions {
  @MF.fragment('order') lastOrder;
}
