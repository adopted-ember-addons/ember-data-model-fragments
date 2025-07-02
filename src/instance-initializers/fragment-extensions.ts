import type { Store } from '@warp-drive/core';
import FragmentExtension from '../extensions/fragment.ts';
import FragmentArrayExtension from '../extensions/fragment-array.ts';
import type ApplicationInstance from '@ember/application/instance';

export function registerFragmentExtensions(store: Store) {
  store.schema.CAUTION_MEGA_DANGER_ZONE_registerExtension?.(FragmentExtension);
  store.schema.CAUTION_MEGA_DANGER_ZONE_registerExtension?.(
    FragmentArrayExtension,
  );
}

export function initialize(application: ApplicationInstance) {
  const store = application.lookup('service:store') as Store | undefined;

  if (store) {
    registerFragmentExtensions(store);
  } else {
    console.warn(
      'No store service was found, you will need to call `registerFragmentExtensions` manually in your app.',
    );
  }
}

export default {
  name: 'fragment-extensions',
  initialize,
};
