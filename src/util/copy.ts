export function copy<T>(value: T, deep = false): T {
  if (value === null || typeof value !== 'object') {
    return value;
  }

  const copyable = value as { copy?: (deep: boolean) => T };
  if (typeof copyable.copy === 'function') {
    return copyable.copy(deep);
  }

  if (deep) {
    return structuredClone(value);
  }

  if (Array.isArray(value)) {
    return [...value] as T;
  }

  return { ...value };
}
