import {
  setupApplicationTest as upstreamSetupApplicationTest,
  setupRenderingTest as upstreamSetupRenderingTest,
  setupTest as upstreamSetupTest,
  type SetupTestOptions,
} from 'ember-qunit';
import type Owner from '@ember/owner';
import type { FullName, RegistryProxy } from '@ember/-internals/owner';
import type { TestContext as BaseTestContext } from '@ember/test-helpers';
import type Store from '../../demo-app/services/store.ts';

/**
 * The owner a test receives is an `ApplicationInstance`, which mixes in the
 * full registry API — `hasRegistration`, `unregister`, and friends. The
 * public `Owner` interface from `@ember/owner` deliberately exposes only the
 * subset apps are meant to reach for, and types `lookup` against the DI
 * registry, which this app never populates, so every lookup would come back
 * as `object | undefined`.
 */
export type TestOwner = Omit<Owner, 'lookup'> &
  Pick<RegistryProxy, 'hasRegistration' | 'unregister'> & {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see above
    lookup(fullName: FullName): any;
  };

/** A QUnit test context whose `owner` is the widened {@link TestOwner}. */
export interface TestContext extends Omit<BaseTestContext, 'owner'> {
  owner: TestOwner;
}

/**
 * The demo app's store, with the four record-carrying methods widened.
 *
 * ember-data 5.x dropped the string-keyed model registry, so
 * `peekRecord('person', '1')` resolves to `unknown` unless the call site
 * names the model class. The suite looks records up by string deliberately —
 * several tests register a *different* class under an existing name — so a
 * static record type would be actively wrong rather than merely missing. The
 * legacy `push` payload shape (`{ data: { type, id, attributes } }`) likewise
 * no longer matches the published overloads.
 *
 * Everything else stays typed. That is the part worth keeping: it is what
 * catches a misspelled or wrongly-arged `createFragment`, `serializerFor`,
 * `pushPayload` or `isFragment`.
 */
/* eslint-disable @typescript-eslint/no-explicit-any -- see above */
export type TestStore = {
  push(payload: any): any;
  findRecord(type: string, id: string | number, options?: object): Promise<any>;
  createRecord(type: string, props?: object): any;
  peekRecord(type: string, id: string | number): any;
} & Store;
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * Instantiate a classic (`EmberObject.extend({...})`) class with arbitrary
 * properties.
 *
 * `CoreObject.create` only accepts keys it can see on the *instance* type, and
 * `extend()` merges its mixins onto the constructor type rather than the
 * instance, so classic classes cannot be constructed through the published
 * typings at all. Parts of this suite exercise the classic object model —
 * observers, uncopyable values — on purpose, so they build through here.
 */
export function createClassic<T = unknown>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see above
  factory: { create(...args: any[]): any },
  props: Record<string, unknown>,
): T {
  return factory.create(props) as T;
}

// This file exists to provide wrappers around ember-qunit's
// test setup functions. This way, you can easily extend the setup that is
// needed per test type.

function setupApplicationTest(hooks: NestedHooks, options?: SetupTestOptions) {
  upstreamSetupApplicationTest(hooks, options);

  // Additional setup for application tests can be done here.
  //
  // For example, if you need an authenticated session for each
  // application test, you could do:
  //
  // hooks.beforeEach(async function (this: TestContext) {
  //   await authenticateSession(); // ember-simple-auth
  // });
  //
  // This is also a good place to call test setup functions coming
  // from other addons:
  //
  // setupIntl(hooks, 'en-us'); // ember-intl
  // setupMirage(hooks); // ember-cli-mirage
}

function setupRenderingTest(hooks: NestedHooks, options?: SetupTestOptions) {
  upstreamSetupRenderingTest(hooks, options);

  // Additional setup for rendering tests can be done here.
}

function setupTest(hooks: NestedHooks, options?: SetupTestOptions) {
  upstreamSetupTest(hooks, options);

  // Additional setup for unit tests can be done here.
}

export { setupApplicationTest, setupRenderingTest, setupTest };
