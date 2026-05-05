import ComponentOptions from './component-options';
import { fragment } from '#src/attributes/index.ts';

export default class ComponentOptionsChart extends ComponentOptions {
  @fragment('order') declare lastOrder: unknown;
}
