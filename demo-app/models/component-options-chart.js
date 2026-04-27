import ComponentOptions from './component-options';
import { fragment } from '#src/attributes/index.js';

export default class ComponentOptionsChart extends ComponentOptions {
  @fragment('order') lastOrder;
}
