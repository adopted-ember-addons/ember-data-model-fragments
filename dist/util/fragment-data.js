/**
  Fragment data from a payload that the serializer leaves for the cache to
  normalize. A function `typeKey` is called with the owner record, which may
  not exist yet while the payload is normalized, so the fragment's type, and
  with it the serializer to normalize with, is only known in the cache.

  The data is wrapped under a string key, so the marker survives copies of
  the normalized document (spreads, `structuredClone`, JSON) and shows up in
  a debugger.
*/
const UNNORMALIZED = '__unnormalizedFragmentData';
function leaveUnnormalized(data) {
  // Anything but an object is passed through for the cache to reject
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  // A copy, as normalizing it mutates it
  return {
    [UNNORMALIZED]: {
      ...data
    }
  };
}

// The payload data a `leaveUnnormalized` wrapper holds, if `value` is one
function unnormalizedData(value) {
  if (typeof value === 'object' && value !== null && Object.hasOwn(value, UNNORMALIZED)) {
    return value[UNNORMALIZED];
  }
  return undefined;
}

/**
  Normalizes a fragment's payload data with its model's serializer, and
  returns the attributes.
*/
function normalizeFragmentData(store, modelName, data) {
  // `FragmentStore#serializerFor` guarantees a JSON-based serializer
  // (FragmentSerializer / JSONSerializer) for fragment model names, so we
  // do not need to defend against REST/JSON:API serializers here.
  const serializer = store.serializerFor(modelName);
  const normalized = serializer.normalize(store.modelFor(modelName), data);

  // `JSONSerializer#normalize` returns a full JSON API document, but we only
  // need the attributes hash
  return normalized?.data?.attributes;
}

export { leaveUnnormalized, normalizeFragmentData, unnormalizedData };
//# sourceMappingURL=fragment-data.js.map
