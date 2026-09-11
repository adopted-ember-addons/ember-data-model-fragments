/**
 * The registry of fragment models, keyed by fragment model name.
 *
 * Apps can register their fragment models here to get typed results from
 * `store.createFragment`, `MF.fragment`, and `MF.fragmentArray`:
 *
 * ```ts
 * import type Name from 'my-app/models/name';
 *
 * declare module 'ember-data-model-fragments/types/registries/fragment' {
 *   export default interface FragmentRegistry {
 *     name: Name;
 *   }
 * }
 * ```
 */
export default interface FragmentRegistry {
}
//# sourceMappingURL=fragment.d.ts.map