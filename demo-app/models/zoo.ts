import Model, { attr, belongsTo } from '@ember-data/model';
import { fragment, fragmentArray } from '#src/attributes/index.ts';
import type { AsyncBelongsTo } from '@ember-data/model';
import type { FragmentArray } from '#src/array/fragment.ts';
import type Animal from './animal.ts';
import type Person from './person.ts';

export default class Zoo extends Model {
  @attr('string') declare name: string;
  @attr('string') declare city: string;
  @fragment('animal', { polymorphic: true, typeKey: '$type' })
  declare star: Animal;
  @fragmentArray('animal', { polymorphic: true, typeKey: '$type' })
  declare animals: FragmentArray<Animal>;
  @belongsTo('person', { async: true, inverse: null })
  declare manager: AsyncBelongsTo<Person>;
}
