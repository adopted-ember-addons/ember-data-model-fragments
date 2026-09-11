import type { FragmentAttributeDecorator, FragmentOptions, FragmentType } from '../-private/types.ts';
/**
 `MF.fragmentArray` defines an attribute on a `DS.Model` or `MF.Fragment`.
 Much like `DS.hasMany`, it creates a property that returns an array of
 fragments of the given type. The array is aware of its original state and so
 has a `hasDirtyAttributes` property and a `rollback` method.

 It takes an optional hash as a second parameter, currently supported options
 are:

 - `defaultValue`: An array literal or a function to be called to set the
 attribute to a default value if none is supplied. Values are deep copied
 before being used. Note that default values will be passed through the
 fragment's serializer when creating the fragment. Defaults to an empty
 array.
 - `polymorphic`: Whether or not the fragments in the array can be child
 classes of the given type.
 - `typeKey`: If `polymorphic` is true, the property to use as the fragment
 type in the normalized data. Defaults to `type`.

 Example

 ```javascript
 App.Person = DS.Model.extend({
    addresses: MF.fragmentArray('address')
  });

 App.Address = MF.Fragment.extend({
    street: DS.attr('string'),
    city: DS.attr('string'),
    region: DS.attr('string'),
    country: DS.attr('string')
  });
 ```

 @namespace MF
 @method fragmentArray
 @param {String} type the fragment type (optional)
 @param {Object} options a hash of options
 @return {Attribute}
 */
export default function fragmentArray<K extends FragmentType>(type: K, options?: FragmentOptions<K>): FragmentAttributeDecorator;
//# sourceMappingURL=fragment-array.d.ts.map