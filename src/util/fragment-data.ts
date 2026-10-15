/**
  Fragment data from a payload that the serializer leaves for the cache to
  normalize. A function `typeKey` is called with the owner record, which may
  not exist yet while the payload is normalized, so the fragment's type, and
  with it the serializer to normalize with, is only known in the cache.
*/
const unnormalized = new WeakSet<object>();

// Marks a copy, so the app's own payload object isn't marked, and passes
// anything but an object through for the cache to reject
export function leaveUnnormalized(data: unknown): unknown {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const copy = { ...data };
  unnormalized.add(copy);
  return copy;
}

export function isUnnormalized(data: unknown): data is object {
  return typeof data === 'object' && data !== null && unnormalized.has(data);
}

/**
  Normalizes a fragment's payload data with its model's serializer, and
  returns the attributes.
*/
export function normalizeFragmentData(
  store: any,
  modelName: string,
  data: unknown,
): any {
  // `FragmentStore#serializerFor` guarantees a JSON-based serializer
  // (FragmentSerializer / JSONSerializer) for fragment model names, so we
  // do not need to defend against REST/JSON:API serializers here.
  const serializer = store.serializerFor(modelName);
  const normalized = serializer.normalize(store.modelFor(modelName), data);

  // `JSONSerializer#normalize` returns a full JSON API document, but we only
  // need the attributes hash
  return normalized?.data?.attributes;
}
