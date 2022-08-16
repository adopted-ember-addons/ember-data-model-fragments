import FragmentRegistry from 'ember-data-model-fragments/types/registries/fragment';	
import EmberStore from '@ember-data/store';

export class Store extends EmberStore {
  createFragment<K extends keyof FragmentRegistry>(	
    type: K,	
    attributes?: Partial<FragmentRegistry[K]>,	
  ): FragmentRegistry[K];
}
