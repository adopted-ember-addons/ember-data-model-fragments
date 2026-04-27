export function copy(value, deep = false) {
  if (value === null || typeof value !== 'object') {
    return value;
  }

  if (typeof value.copy === 'function') {
    return value.copy(deep);
  }

  if (deep) {
    return structuredClone(value);
  }

  if (Array.isArray(value)) {
    return [...value];
  }

  return { ...value };
}
