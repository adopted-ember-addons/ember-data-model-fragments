import Model, { attr, belongsTo } from '@ember-data/model';
import { fragment, fragmentArray } from '#src/attributes/index.js';

export default class Zoo extends Model {
  @attr('string') name;
  @attr('string') city;
  @fragment('animal', { polymorphic: true, typeKey: '$type' }) star;
  @fragmentArray('animal', { polymorphic: true, typeKey: '$type' }) animals;
  @belongsTo('person', { async: true, inverse: null }) manager;
}
