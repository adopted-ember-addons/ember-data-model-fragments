export default function fragmentCacheFor(store) {
  return store.cache.___cache || store.cache;
}
