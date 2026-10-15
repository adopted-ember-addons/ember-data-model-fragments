import type { ArrayOptions, FragmentAttributeDecorator } from '../-private/types.ts';
/**
 `MF.array` defines an attribute on a `DS.Model` or `MF.Fragment`. It creates a
 property that returns an array of values of the given primitive type. The
 array is aware of its original state and so has a `hasDirtyAttributes`
 property and a `rollback` method.

 It takes an optional hash as a second parameter, currently supported options
 are:

 - `defaultValue`: An array literal or a function to be called to set the
 attribute to a default value if none is supplied. Values are deep copied
 before being used. Note that default values will be passed through the
 fragment's serializer when creating the fragment.

 Example

 ```javascript
 App.Person = DS.Model.extend({
    aliases: MF.array('string')
  });
 ```

 @namespace MF
 @method array
 @param {String} type the type of value contained in the array
 @param {Object} options a hash of options
 @return {Attribute}
 */
export default function array(type?: string, options?: ArrayOptions): FragmentAttributeDecorator;
export default function array(options?: ArrayOptions): FragmentAttributeDecorator;
//# sourceMappingURL=array.d.ts.map