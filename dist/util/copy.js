function copy(value, deep = false) {
  if (value === null || typeof value !== 'object') {
    return value;
  }
  const copyable = value;
  if (typeof copyable.copy === 'function') {
    return copyable.copy(deep);
  }
  if (value instanceof Date) {
    return new Date(value.getTime());
  }
  if (deep) {
    return structuredClone(value);
  }
  if (Array.isArray(value)) {
    return [...value];
  }
  return {
    ...value
  };
}

export { copy };
//# sourceMappingURL=copy.js.map
