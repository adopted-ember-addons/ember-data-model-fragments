/**
 * Internal shared types for ember-data-model-fragments.
 *
 * This module is type-only: it produces no runtime output and is not part of
 * the addon's public runtime API surface.
 */
import type Model from '@ember-data/model';
import type Fragment from '../fragment.ts';
import type { FragmentArray } from '../array/fragment.ts';
import type { StatefulArray } from '../array/stateful.ts';
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
// The `keyof FragmentRegistry` constituent is `never` until something augments
// the registry, at which point it drives typed results. The demo app augments
// it (see `demo-app/fragment-registry.ts`), so this project always lints with
// the populated shape — drop that file and
// `@typescript-eslint/no-redundant-type-constituents` starts firing here.
export type FragmentType = keyof FragmentRegistry | (string & {});

/** Resolve a fragment model name to its registered class, if any. */
export type RegisteredFragment<K> = K extends keyof FragmentRegistry
  ? FragmentRegistry[K]
  : Fragment;

/**
 * A fragment instance, matched on the `_isFragment` brand rather than on
 * `Fragment` itself — see the note on `FragmentArray` for why a subclass is
 * not assignable to `Fragment`.
 */
type FragmentLike = Pick<Fragment, '_isFragment'>;

/**
 * The attribute keys a fragment class declares on top of `Fragment`. Methods
 * are dropped: only data-bearing properties can appear in a raw hash.
 */
type FragmentDataKeys<T> = {
  [K in Exclude<keyof T, keyof Fragment>]-?: T[K] extends (
    ...args: never[]
  ) => unknown
    ? never
    : K;
}[Exclude<keyof T, keyof Fragment>];

/**
 * The raw form of one fragment attribute.
 *
 * A fragment property *getter* hands back a materialized wrapper — a
 * `FragmentArray`, a `StatefulArray`, a `Fragment` — but the raw hash that
 * goes in is plain data. `Partial<TheFragmentClass>` conflates the two and so
 * rejects the very literals callers are supposed to write.
 */
type RawFragmentValue<V> =
  V extends FragmentArray<infer F>
    ? (FragmentDataFor<F> | F)[]
    : V extends StatefulArray<infer E>
      ? E[]
      : V extends FragmentLike
        ? FragmentDataFor<V> | V
        : V;

/** The raw attribute hash accepted for a given fragment class. */
export type FragmentDataFor<T> = {
  [K in FragmentDataKeys<T>]?: RawFragmentValue<T[K]>;
};

/**
 * A raw fragment attribute hash, as accepted by `defaultValue` and handed to
 * a polymorphic `typeKey` function.
 *
 * Registered names resolve to the fragment's own attributes in raw form.
 * Unregistered names fall back to an open record: `Fragment` declares no
 * attributes of its own, so anything narrower would reject every hash a
 * caller could actually write.
 */
export type FragmentData<K> = K extends keyof FragmentRegistry
  ? FragmentDataFor<FragmentRegistry[K]>
  : Record<string, unknown>;

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

/**
 * The function form of `defaultValue`. It is invoked with the owner record,
 * the attribute's own options hash, and the attribute's key — see
 * `FragmentStateManager`'s `getDefaultValue`.
 */
export type DefaultValueFn<Options, Value> = (
  record: Model,
  options: Options,
  key: string,
) => Value;

/** Options accepted by `MF.fragment` and `MF.fragmentArray`. */
export interface FragmentOptions<K extends FragmentType = FragmentType> {
  polymorphic?: boolean;
  typeKey?: string | ((data: FragmentData<K>, owner: Model) => string);
  defaultValue?:
    | FragmentData<K>
    | FragmentData<K>[]
    | DefaultValueFn<
        FragmentOptions<K>,
        | FragmentData<K>
        | FragmentData<K>[]
        | RegisteredFragment<K>
        | RegisteredFragment<K>[]
        | null
      >
    | null;
}

/**
 * The subset of the attribute options that `metaTypeFor` reads.
 *
 * Declared structurally rather than as `FragmentOptions` because the
 * `typeKey` callback's parameter makes `FragmentOptions<K>` invariant in `K`:
 * once a consumer augments `FragmentRegistry`, a `FragmentOptions<'name'>`
 * stops being assignable to `FragmentOptions<FragmentType>`, and every
 * decorator that forwards its options would fail to compile.
 */
export interface MetaTypeOptions {
  polymorphic?: boolean;
  typeKey?: string | ((...args: never[]) => string);
}

/** Options accepted by `MF.array`. */
export interface ArrayOptions {
  defaultValue?:
    unknown[] | DefaultValueFn<ArrayOptions, unknown[] | null> | null;
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
