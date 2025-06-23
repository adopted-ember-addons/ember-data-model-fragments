import type { Store } from '@warp-drive/core';
import FragmentTransformation from '../transformations/fragment.ts';
import FragmentArrayTransformation from '../transformations/fragment-array.ts';
import type Owner from '@ember/owner';
import type { Transformation } from '@warp-drive/schema-record';

export function registerFragmentTransforms(store: Store) {
  store.schema.registerTransformation(FragmentTransformation as Transformation);
  store.schema.registerTransformation(
    FragmentArrayTransformation as Transformation,
  );
}

export function initialize(application: Owner) {
  const store = application.lookup('service:store') as Store | undefined;

  if (store) {
    registerFragmentTransforms(store);
  } else {
    console.warn(
      'Could not find store service for fragment transform registration',
    );
  }
}

export default {
  name: 'fragment-transforms',
  initialize,
};
