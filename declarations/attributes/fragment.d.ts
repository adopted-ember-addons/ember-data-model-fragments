import type { FragmentAttributeDecorator, FragmentOptions, FragmentType } from '../-private/types.ts';
/**
 `MF.fragment` defines an attribute on a `DS.Model` or `MF.Fragment`. Much
 like `DS.belongsTo`, it creates a property that returns a single fragment of
 the given type.

 It takes an optional hash as a second parameter, currently supported options
 are:

 - `defaultValue`: An object literal or a function to be called to set the
 attribute to a default value if none is supplied. Values are deep copied
 before being used. Note that default values will be passed through the
 fragment's serializer when creating the fragment. Defaults to `null`.
 - `polymorphic`: Whether or not the fragments in the array can be child
 classes of the given type.
 - `typeKey`: If `polymorphic` is true, the property to use as the fragment
 type in the normalized data. Defaults to `type`.

 Example

 ```javascript
 App.Person = DS.Model.extend({
    name: MF.fragment('name', { defaultValue: {} })
  });

 App.Name = MF.Fragment.extend({
    first: DS.attr('string'),
    last: DS.attr('string')
  });
 ```

 @namespace MF
 @method fragment
 @param {String} type the fragment type
 @param {Object} options a hash of options
 @return {Attribute}
 */
export default function fragment<K extends FragmentType>(type: K, options?: FragmentOptions<K>): FragmentAttributeDecorator;
//# sourceMappingURL=fragment.d.ts.map