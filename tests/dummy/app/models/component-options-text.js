import { attr } from '@ember-data/model';
import ComponentOptions from './component-options';

export default class ComponentOptionsText extends ComponentOptions {
  @attr('string') fontFamily;
  @attr('number') fontSize;
}