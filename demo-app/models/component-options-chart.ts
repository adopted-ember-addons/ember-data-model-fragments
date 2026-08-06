import ComponentOptions from './component-options.ts';
import { fragment } from '#src/attributes/index.ts';
import type Order from './order.ts';

export default class ComponentOptionsChart extends ComponentOptions {
  @fragment('order') declare lastOrder: Order;
}
