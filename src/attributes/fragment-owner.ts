import { assert } from '@ember/debug';
import { computed } from '@ember/object';
import { isDestroying, isDestroyed } from '@ember/destroyable';
import { isFragment } from '../fragment.ts';
import { recordIdentifierFor } from '@ember-data/store';
import fragmentCacheFor from '../util/fragment-cache.ts';

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
export default function fragmentOwner(): PropertyDecorator {
  // No dependent keys: the value is invalidated via notifyPropertyChange in
  // setFragmentOwner(). Omitting dependent keys also avoids Ember's
  // "Attempted to access the computed ... on a destroyed object" assertion
  // when a fragment is torn down.
  // eslint-disable-next-line ember/require-computed-property-dependencies
  return computed(function (this: any) {
    if (isDestroying(this) || isDestroyed(this)) {
      return null;
    }
    assert(
      'Fragment owner properties can only be used on fragments.',
      isFragment(this),
    );
    const identifier = recordIdentifierFor(this);
    const owner = fragmentCacheFor(this.store).getFragmentOwner(identifier);
    if (!owner) {
      return null;
    }
    // Get the owner record from the identifier
    return this.store._instanceCache.getRecord(owner.ownerIdentifier);
  })
    .meta({
      isFragmentOwner: true,
    })
    .readOnly() as unknown as PropertyDecorator;
}
