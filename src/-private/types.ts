/**
 * Internal shared types for ember-data-model-fragments.
 *
 * This module is type-only: it produces no runtime output and is not part of
 * the addon's public runtime API surface.
 */
import type Model from '@ember-data/model';
import type Fragment from '../fragment.ts';
import type FragmentRegistry from '../types/registries/fragment.ts';

/**
 * Minimal structural type for ember-data's `StableRecordIdentifier`.
 *
 * ember-data has moved this type between packages across the 4.x/5.x series
 * (`@ember-data/types`, `@warp-drive/core-types`, `@warp-drive/core`), so we
 * describe the shape we rely on structurally instead of importing it.
 */
export interface FragmentIdentifier {
  type: string;
  id: string | null;
  lid: string;
}

/** The owner bookkeeping stored for each fragment in the fragment cache. */
export interface FragmentOwnerInfo {
  ownerIdentifier: FragmentIdentifier;
  key: string;
}

/**
 * A fragment model name. Names registered in `FragmentRegistry` get typed
 * results; unregistered names fall back to `Fragment`.
 */
// The `keyof FragmentRegistry` constituent is `never` until consumers augment
// the registry, at which point it drives typed results — the union is not
// redundant in consuming apps.
// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
export type FragmentType = keyof FragmentRegistry | (string & {});

/** Resolve a fragment model name to its registered class, if any. */
export type RegisteredFragment<K> = K extends keyof FragmentRegistry
  ? FragmentRegistry[K]
  : Fragment;

/**
 * The decorator returned by `MF.fragment`, `MF.fragmentArray`, `MF.array`,
 * and `MF.fragmentOwner`. Mirrors the shape of `@ember-data/model`'s
 * `DataDecorator`. At runtime this is an Ember computed property, so it also
 * works in classic `.extend({})` class bodies.
 */
export type FragmentAttributeDecorator = (
  target: object,
  key: string,
  desc?: PropertyDescriptor,
) => void;

/** Options accepted by `MF.fragment` and `MF.fragmentArray`. */
export interface FragmentOptions<K extends FragmentType = FragmentType> {
  polymorphic?: boolean;
  typeKey?:
    string | ((data: Partial<RegisteredFragment<K>>, owner: Model) => string);
  defaultValue?:
    | Partial<RegisteredFragment<K>>
    | Partial<RegisteredFragment<K>>[]
    | (() =>
        | Partial<RegisteredFragment<K>>
        | Partial<RegisteredFragment<K>>[]
        | null)
    | null;
}

/** Options accepted by `MF.array`. */
export interface ArrayOptions {
  defaultValue?: unknown[] | (() => unknown[] | null) | null;
}

/**
 * The attribute meta stored for fragment attributes. This is what
 * `eachComputedProperty` yields for properties defined with the fragment
 * attribute decorators, and what the schema service / serializers inspect.
 */
export interface FragmentAttributeMeta {
  type: string;
  isAttribute: true;
  isFragment: true;
  kind: 'fragment' | 'fragment-array' | 'array';
  options: FragmentOptions & ArrayOptions & Record<string, unknown>;
  modelName?: string;
  arrayTransform?: string;
}
