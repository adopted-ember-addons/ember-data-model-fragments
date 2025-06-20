import type Store from '@ember-data/store';
import FragmentTransformation from './transformations/fragment.ts';

export function registerFragmentSchemaAndTransformations(store: Store) {
  store.schema.registerTransformation(FragmentTransformation);
}
