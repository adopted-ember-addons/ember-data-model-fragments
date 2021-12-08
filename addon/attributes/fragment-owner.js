import { assert } from '@ember/debug';
import { computed } from '@ember/object';
import { isFragment } from '../fragment';
import { recordDataFor } from '@ember-data/store/-private';

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
export default function fragmentOwner() {
  // eslint-disable-next-line ember/require-computed-property-dependencies
  return computed(function() {
    assert('Fragment owner properties can only be used on fragments.', isFragment(this));
    const recordData = recordDataFor(this);
    const owner = recordData.getFragmentOwner();
    if (!owner) {
      return null;
    }
    return this.store._internalModelForResource(owner.identifier).getRecord();
  }).meta({
    isFragmentOwner: true
  }).readOnly();
}
