import FragmentRegistry from 'ember-data-model-fragments/types/registries/fragment';	
import FragmentAttributesRegistry from 'ember-data-model-fragments/types/registries/fragment-attributes';
import EmberStore from '@ember-data/store';

export class Store extends EmberStore {
  createFragment<K extends keyof FragmentRegistry>(	
    type: K,	
    attributes?: FragmentAttributesRegistry[K],	
  ): FragmentRegistry[K];
}
