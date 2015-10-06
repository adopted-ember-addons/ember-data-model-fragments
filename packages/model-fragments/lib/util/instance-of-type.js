// Check whether a object is an instance of the given type, respecting model
// factory injections
export default function isInstanceOfType(type, obj) {
  if (obj instanceof type) {
    return true;
  } else if (Ember.MODEL_FACTORY_INJECTIONS) {
    return obj instanceof type.superclass;
  }

  return false;
}
