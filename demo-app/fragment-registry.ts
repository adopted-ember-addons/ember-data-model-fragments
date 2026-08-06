/**
 * Registers this app's fragment models with the addon, so that
 * `store.createFragment(...)`, `@fragment(...)`'s `defaultValue`, and
 * polymorphic `typeKey` callbacks resolve to real types instead of open
 * records.
 *
 * A consuming app writes the module specifier as the published path:
 *
 * ```ts
 * declare module 'ember-data-model-fragments/types/registries/fragment' {
 *   export default interface FragmentRegistry {
 *     name: Name;
 *   }
 * }
 * ```
 *
 * The demo app lives inside the addon itself and cannot resolve the package
 * by its own name, so it augments the source module directly. The effect is
 * identical.
 */
import type Address from './models/address.ts';
import type Animal from './models/animal.ts';
import type ComponentOptions from './models/component-options.ts';
import type ComponentOptionsChart from './models/component-options-chart.ts';
import type ComponentOptionsText from './models/component-options-text.ts';
import type Elephant from './models/elephant.ts';
import type Hobby from './models/hobby.ts';
import type House from './models/house.ts';
import type Info from './models/info.ts';
import type Lion from './models/lion.ts';
import type Name from './models/name.ts';
import type Order from './models/order.ts';
import type Passenger from './models/passenger.ts';
import type Prefix from './models/prefix.ts';
import type Product from './models/product.ts';

declare module '#src/types/registries/fragment.ts' {
  export default interface FragmentRegistry {
    address: Address;
    animal: Animal;
    'component-options': ComponentOptions;
    'component-options-chart': ComponentOptionsChart;
    'component-options-text': ComponentOptionsText;
    elephant: Elephant;
    hobby: Hobby;
    house: House;
    info: Info;
    lion: Lion;
    name: Name;
    order: Order;
    passenger: Passenger;
    prefix: Prefix;
    product: Product;
  }
}
