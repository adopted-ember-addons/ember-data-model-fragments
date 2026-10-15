import type FragmentCache from '../cache/fragment-cache.ts';

const CACHE_METHODS = [
  'createFragmentRecordData',
  'getFragment',
  'hasFragment',
  'setDirtyFragment',
  'isFragmentDirty',
  'getFragmentOwner',
  'setFragmentOwner',
  'newFragmentIdentifierForKey',
  'getFragmentArrayCache',
  'setFragmentArrayCache',
  'rollbackFragment',
  'hasChangedFragments',
  'changedFragments',
  'getFragmentCanonicalState',
  'getFragmentCurrentState',
];

function installCacheManagerCompat(
  store: any,
  rawCache: any = store.cache,
): FragmentCache {
  const cacheManager = rawCache;
  const cache = cacheManager?.___cache;

  if (!cacheManager || !cache || cacheManager.__mfCompatInstalled) {
    return (cache || cacheManager) as FragmentCache;
  }

  Object.defineProperty(cacheManager, '__mfCompatInstalled', {
    value: true,
    configurable: true,
  });

  Object.defineProperty(cacheManager, '__innerCache', {
    get() {
      return cache.__innerCache;
    },
    configurable: true,
  });

  CACHE_METHODS.forEach((methodName) => {
    if (typeof cacheManager[methodName] === 'function') {
      return;
    }

    Object.defineProperty(cacheManager, methodName, {
      value(...args: unknown[]) {
        return cache[methodName](...args);
      },
      configurable: true,
    });
  });

  return cache as FragmentCache;
}

export { installCacheManagerCompat };

export default function fragmentCacheFor(store: any): FragmentCache {
  return installCacheManagerCompat(store);
}
