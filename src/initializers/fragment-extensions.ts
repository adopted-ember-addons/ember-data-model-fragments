import type { Store } from '@warp-drive/core';
import FragmentExtension from '../extensions/fragment.ts';
import FragmentArrayExtension from '../extensions/fragment-array.ts';
import type Owner from '@ember/owner';

export function registerFragmentExtensions(store: Store) {
  store.schema.CAUTION_MEGA_DANGER_ZONE_registerExtension?.(FragmentExtension);
  store.schema.CAUTION_MEGA_DANGER_ZONE_registerExtension?.(
    FragmentArrayExtension,
  );
}

export function initialize(application: Owner) {
  const store = application.lookup('service:store') as Store | undefined;

  if (store) {
    registerFragmentExtensions(store);
  } else {
    console.warn(
      'Could not find store service for fragment extension registration',
    );
  }
}

export default {
  name: 'fragment-extensions',
  initialize,
};
