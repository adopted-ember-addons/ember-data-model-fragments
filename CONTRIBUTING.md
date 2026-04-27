# How To Contribute

## Installation

- `git clone <repository-url>`
- `cd ember-data-model-fragments`
- `pnpm install`

## Linting

- `pnpm lint`
- `pnpm lint:fix`
- `pnpm lint:types` – Runs `ember-tsc --noEmit` for type checking

## TypeScript

The source, tests, and demo app are written in TypeScript (`.ts`/`.gts`). To
keep this PR focused, every source file currently starts with a `// @ts-nocheck`
header. Public API types live in handrolled declaration files under
`declarations/` (`attributes.d.ts`, `ext.d.ts`, `fragment.d.ts`,
`types/registries/fragment.d.ts`).

Incremental typing is welcome: removing `// @ts-nocheck` from a single file at
a time and adding precise types is the recommended path. Once the source-level
types cover the public API, the handrolled `declarations/*.d.ts` files can be
replaced with output emitted by `ember-tsc` (`tsconfig.publish.json` is already
configured for this).

## Running tests

- `pnpm test` – Builds the test bundle with Vite and runs it via Testem (CI mode)

## Running the demo application

- `pnpm start`
- Visit the demo application at [http://localhost:4200](http://localhost:4200).
