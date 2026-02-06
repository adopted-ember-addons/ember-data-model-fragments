import Model from '@ember-data/model';
import { Snapshot } from '@ember-data/legacy-compat/-private';
/**
  @module ember-data-model-fragments
*/

/**
  Override `Snapshot._attributes` to snapshot fragment attributes before they are
  passed to the `DS.Model#serialize`.

  @private
*/
const oldSnapshotAttributes = Object.getOwnPropertyDescriptor(
  Snapshot.prototype,
  '_attributes',
);

// Symbol to store our converted attributes cache
const FRAGMENT_ATTRS = Symbol('fragmentAttrs');

Object.defineProperty(Snapshot.prototype, '_attributes', {
  get() {
    // Return cached converted attrs if available
    if (this[FRAGMENT_ATTRS]) {
      return this[FRAGMENT_ATTRS];
    }

    const cachedAttrs = oldSnapshotAttributes.get.call(this);

    // Create a new object to avoid modifying the cached __attributes in place
    // This is needed because ember-data caches __attributes and reuses it
    const attrs = Object.create(null);

    Object.keys(cachedAttrs).forEach((key) => {
      const attr = cachedAttrs[key];

      // If the attribute has a `_createSnapshot` method, invoke it before the
      // snapshot gets passed to the serializer
      if (attr && typeof attr._createSnapshot === 'function') {
        attrs[key] = attr._createSnapshot();
      } else if (Array.isArray(attr)) {
        // Handle arrays of fragments (fragment arrays)
        attrs[key] = attr.map((item) => {
          if (item && typeof item._createSnapshot === 'function') {
            return item._createSnapshot();
          }
          return item;
        });
      } else {
        attrs[key] = attr;
      }
    });

    // Cache the converted attrs
    this[FRAGMENT_ATTRS] = attrs;

    return attrs;
  },
});

export { Model };
