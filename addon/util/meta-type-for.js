
// Create a unique type string for the combination of fragment property type,
// transform type (or fragment model), and polymorphic type key
export default function metaTypeFor(name, type, options) {
  let metaType = `-mf-${name}`;

  if (type) {
    metaType += `$${type}`;
  }

  if (options && options.polymorphic) {
    let typeKey = options.typeKey || 'type';
    metaType += `$${typeKey}`;
  }

  return metaType;
}
