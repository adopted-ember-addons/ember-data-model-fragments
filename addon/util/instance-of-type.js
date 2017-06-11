
// Check whether a object is an instance of the given type, respecting model
// factory injections
export default function isInstanceOfType(type, obj) {
  return obj instanceof type;
}
