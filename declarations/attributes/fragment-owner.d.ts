import type { FragmentAttributeDecorator } from '../-private/types.ts';
/**
 `MF.fragmentOwner` defines a read-only attribute on a `MF.Fragment`
 instance. The attribute returns a reference to the fragment's owner
 record.

 Example

 ```javascript
 App.Person = DS.Model.extend({
    name: MF.fragment('name')
  });

 App.Name = MF.Fragment.extend({
    first: DS.attr('string'),
    last: DS.attr('string'),
    person: MF.fragmentOwner()
  });
 ```

 @namespace MF
 @method fragmentOwner
 @return {Attribute}
 */
export default function fragmentOwner(): FragmentAttributeDecorator;
//# sourceMappingURL=fragment-owner.d.ts.map