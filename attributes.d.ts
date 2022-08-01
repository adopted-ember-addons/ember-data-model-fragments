import Model from '@ember-data/model';
import EmberArray from '@ember/array';
import ComputedProperty from '@ember/object/computed';
import FragmentRegistry from 'ember-data-model-fragments/types/registries/fragment';
import FragmentAttributesRegistry from 'ember-data-model-fragments/types/registries/fragment-attributes';
// eslint-disable-next-line ember/use-ember-data-rfc-395-imports
import TransformRegistry from 'ember-data/types/registries/transform';

interface FragmentArray<FragmentType extends keyof FragmentRegistry> extends EmberArray<FragmentType> {
  addFragment(fragment: FragmentRegistry[FragmentType]): FragmentRegistry[FragmentType];
  removeFragment(fragment: FragmentRegistry[FragmentType]): FragmentRegistry[FragmentType];
  createFragment(attributes: FragmentAttributesRegistry[FragmentType]): FragmentRegistry[FragmentType];
}

interface FragmentOptions<FragmentType extends keyof FragmentRegistry> {
  polymorphic?: boolean;
  typeKey?: string | ((data: FragmentAttributesRegistry[FragmentType], owner: Model) => string);
  defaultValue?: () => FragmentAttributesRegistry[FragmentType] | FragmentAttributesRegistry[FragmentType];
}

type TransformType<FragmentType extends keyof TransformRegistry> = ReturnType<
  TransformRegistry[FragmentType]['deserialize']
>;

export function fragment<FragmentType extends keyof FragmentRegistry>(
  type: FragmentType,
  options?: FragmentOptions<FragmentType>,
): ComputedProperty<FragmentRegistry[FragmentType]>;
export function fragmentArray<FragmentType extends keyof FragmentRegistry>(
  type: FragmentType,
  options?: FragmentOptions<FragmentType>,
): ComputedProperty<FragmentArray<FragmentType>>;
export function array<FragmentType extends keyof TransformRegistry>(): ComputedProperty<TransformRegistry[FragmentType]>;

export function fragmentOwner(): ComputedProperty<Model>;
