import ComponentOptions from './component-options';
import { attr } from '@ember-data/model';

export default class ComponentOptionsText extends ComponentOptions {
  @attr('string') fontFamily;
  @attr('number') fontSize;
}
