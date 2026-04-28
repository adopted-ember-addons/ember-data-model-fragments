import Model, { attr, belongsTo } from '@ember-data/model';
import { fragment, fragmentArray } from '#src/attributes/index.ts';

export default class Zoo extends Model {
  @attr('string') declare name: string;
  @attr('string') declare city: string;
  @fragment('animal', { polymorphic: true, typeKey: '$type' })
  declare star: unknown;
  @fragmentArray('animal', { polymorphic: true, typeKey: '$type' })
  declare animals: unknown;
  @belongsTo('person', { async: true, inverse: null }) declare manager: unknown;
}
