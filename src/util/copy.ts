export function copy<Value>(value: Value, deep = false) {
  if (value === null || typeof value !== 'object') {
    return value;
  }

  if (deep) {
    return structuredClone(value);
  }

  if (Array.isArray(value)) {
    return [...value];
  }

  return { ...value };
}
