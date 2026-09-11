import type { MetaTypeOptions } from '../-private/types.ts';

// Create a unique type string for the combination of fragment property type,
// transform type (or fragment model), and polymorphic type key
export default function metaTypeFor(
  name: 'fragment' | 'fragment-array' | 'array',
  type?: string,
  options?: MetaTypeOptions,
): string {
  let metaType = `-mf-${name}`;

  if (type) {
    metaType += `$${type}`;
  }

  if (options && options.polymorphic) {
    let typeKey = options.typeKey || 'type';
    typeKey = typeof typeKey === 'function' ? '__dynamic__' : typeKey;
    metaType += `$${typeKey}`;
  }

  return metaType;
}
