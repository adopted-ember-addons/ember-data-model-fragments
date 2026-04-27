// @ts-nocheck -- incremental TS conversion; types will be tightened in follow-up PRs.
import ComponentOptions from './component-options';
import { fragment } from '#src/attributes/index.ts';

export default class ComponentOptionsChart extends ComponentOptions {
  @fragment('order') lastOrder;
}
