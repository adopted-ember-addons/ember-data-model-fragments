import { assert } from '@ember/debug';
import { computed } from '@ember/object';
import { isFragment } from '../fragment';
import { recordIdentifierFor } from '@ember-data/store';

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
  return computed('store.{_instanceCache,cache}', function () {
    assert(
      'Fragment owner properties can only be used on fragments.',
      isFragment(this),
    );
    const identifier = recordIdentifierFor(this);
    const owner = this.store.cache.getFragmentOwner(identifier);
    if (!owner) {
      return null;
    }
    // Get the owner record from the identifier
    return this.store._instanceCache.getRecord(owner.ownerIdentifier);
  })
    .meta({
      isFragmentOwner: true,
    })
    .readOnly();
}
