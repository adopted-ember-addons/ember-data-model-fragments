import Model from '@ember-data/model';
import EmberArray from '@ember/array';
import ComputedProperty from '@ember/object/computed';
import Fragment from 'ember-data-model-fragments/fragment';
import FragmentRegistry from 'ember-data-model-fragments/types/registries/fragment';
// eslint-disable-next-line ember/use-ember-data-rfc-395-imports
import TransformRegistry from 'ember-data/types/registries/transform';

interface FragmentArray<T extends Fragment> extends EmberArray<T> {
  addFragment(fragment: T): T;
  removeFragment(fragment: T): T;
  createFragment(attributes?: Partial<T>): T;
}

interface FragmentOptions<K extends keyof FragmentRegistry> {
  polymorphic?: boolean;
  typeKey?: string | ((data: FragmentRegistry[K], owner: Model) => string);
  defaultValue?: Partial<FragmentRegistry[K]> | (() => Partial<FragmentRegistry[K]>);
}

type TransformType<K extends keyof TransformRegistry> = ReturnType<
  TransformRegistry[K]['deserialize']
>;

export function fragment<K extends keyof FragmentRegistry>(
  type: K,
  options?: FragmentOptions<K>,
): ComputedProperty<FragmentRegistry[K]>;
export function fragmentArray<K extends keyof FragmentRegistry>(
  type: K,
  options?: FragmentOptions<K>,
): ComputedProperty<FragmentArray<FragmentRegistry[K]>>;
export function array<T extends keyof TransformRegistry>(): ComputedProperty<TransformRegistry[T]>;

export function fragmentOwner(): ComputedProperty<Model>;
