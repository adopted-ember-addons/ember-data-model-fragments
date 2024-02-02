import ComponentOptions from './component-options';
import { fragment } from 'ember-data-model-fragments/attributes';

export default class ComponentOptionsChart extends ComponentOptions {
  @fragment('order') lastOrder;
}
