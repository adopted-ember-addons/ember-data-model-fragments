// Check whether a object is an instance of the given type, respecting model
// factory injections
export default function isInstanceOfType(
  type: abstract new (...args: never[]) => unknown,
  obj: unknown,
) {
  return obj instanceof type;
}
