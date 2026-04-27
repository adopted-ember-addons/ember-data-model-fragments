import Model from '@ember-data/model';
import { dependencySatisfies, macroCondition } from '@embroider/macros';
import { Snapshot } from '@ember-data/legacy-compat/-private';
import fragmentCacheFor from './util/fragment-cache.js';
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

function convertSnapshotValue(value) {
  if (value && typeof value._createSnapshot === 'function') {
    return value._createSnapshot();
  }

  if (Array.isArray(value)) {
    return value.map((item) => convertSnapshotValue(item));
  }

  return value;
}

function isFragmentDefinition(definition) {
  return definition?.isFragment || definition?.options?.isFragment;
}

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
      attrs[key] = convertSnapshotValue(cachedAttrs[key]);
    });

    if (macroCondition(dependencySatisfies('ember-data', '>=5.8.0'))) {
      const schema = this._store.getSchemaDefinitionService?.();

      if (schema) {
        const definitions = schema.attributesDefinitionFor(this.identifier);

        Object.entries(definitions).forEach(([key, definition]) => {
          if (key in attrs || !isFragmentDefinition(definition)) {
            return;
          }

          attrs[key] = convertSnapshotValue(
            fragmentCacheFor(this._store).getAttr(this.identifier, key),
          );
        });
      }
    }

    // Cache the converted attrs
    this[FRAGMENT_ATTRS] = attrs;

    return attrs;
  },
});

export { Model };
