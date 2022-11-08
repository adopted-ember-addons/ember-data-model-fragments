import Fragment from 'ember-data-model-fragments/fragment';

/**
 * Define all the models here.
 */
export default interface FragmentRegistry {
  [key: string]: Fragment;
}
