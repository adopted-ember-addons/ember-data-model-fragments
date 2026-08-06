/**
 * Map `import.meta.glob` keys onto the shape the strict resolver expects.
 *
 * The resolver matches entries against a `./[type]/[name]` pattern, so the
 * file extension has to go, and globs written from outside the app root
 * (the test app globs `../demo-app/models/**` and friends) have to have
 * their prefix rewritten back to `./`.
 *
 * ```js
 * normalizeGlob(import.meta.glob('./models/**''/*', { eager: true }));
 * // { './models/lion': ... }
 *
 * normalizeGlob(
 *   import.meta.glob('../demo-app/models/**''/*', { eager: true }),
 *   '../demo-app/',
 * );
 * // { './models/lion': ... }
 * ```
 *
 * @param glob the eager `import.meta.glob` result
 * @param prefix the leading path segment to replace with `./`
 */
export default function normalizeGlob(
  glob: Record<string, unknown>,
  prefix = './',
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(glob).map(([key, value]) => [
      key.replace(prefix, './').replace(/\.(js|gjs|ts|gts)$/, ''),
      value,
    ]),
  );
}
