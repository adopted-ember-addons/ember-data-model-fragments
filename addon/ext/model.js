import Model from '@ember-data/model';
import { getOwner } from '@ember/application';

// Store original methods so we can call them
const originalRollbackAttributes = Model.prototype.rollbackAttributes;
const originalHasDirtyAttributes = Object.getOwnPropertyDescriptor(
  Model.prototype,
  'hasDirtyAttributes',
);
const originalChangedAttributes = Object.getOwnPropertyDescriptor(
  Model.prototype,
  'changedAttributes',
);

/**
 * Add createFragment method to all DS.Model instances
 */
Model.prototype.createFragment = function (type, data = {}) {
  const owner = getOwner(this);
  if (!owner) {
    throw new Error('Could not find owner to create fragment');
  }

  const factory = owner.factoryFor(`model:${type}`);
  if (!factory) {
    throw new Error(
      `Could not find fragment class for type: ${type}. Make sure the fragment model is defined at app/models/${type}.js`,
    );
  }

  const fragmentClass = factory.class;
  return new fragmentClass(data, this);
};

/**
 * Override rollbackAttributes to handle fragments
 */
Model.prototype.rollbackAttributes = function () {
  // First rollback fragment attributes
  this.eachAttribute((key, meta) => {
    if (
      meta.type === 'fragment' ||
      meta.type === 'fragment-array' ||
      meta.type === 'array'
    ) {
      const value = this.get(key);
      if (value && typeof value.rollbackAttributes === 'function') {
        value.rollbackAttributes();
      }
    }
  });

  // Then call the original rollback
  return originalRollbackAttributes.call(this);
};

/**
 * Override hasDirtyAttributes to include fragment dirty state
 */
Object.defineProperty(Model.prototype, 'hasDirtyAttributes', {
  get() {
    // Check regular attributes first
    if (originalHasDirtyAttributes.get.call(this)) {
      return true;
    }

    // Check fragment attributes
    let hasFragmentChanges = false;
    this.eachAttribute((key, meta) => {
      if (
        meta.type === 'fragment' ||
        meta.type === 'fragment-array' ||
        meta.type === 'array'
      ) {
        const value = this.get(key);
        if (value && value.hasDirtyAttributes) {
          hasFragmentChanges = true;
        }
      }
    });

    return hasFragmentChanges;
  },
  configurable: true,
});

/**
 * Override changedAttributes to include fragment changes
 */
Object.defineProperty(Model.prototype, 'changedAttributes', {
  get() {
    // Get regular changed attributes
    const changes = originalChangedAttributes.get.call(this) || {};

    // Add fragment changes
    this.eachAttribute((key, meta) => {
      if (
        meta.type === 'fragment' ||
        meta.type === 'fragment-array' ||
        meta.type === 'array'
      ) {
        const value = this.get(key);
        if (
          value &&
          value.hasDirtyAttributes &&
          typeof value.changedAttributes === 'object'
        ) {
          const fragmentChanges = value.changedAttributes;
          if (Object.keys(fragmentChanges).length > 0) {
            changes[key] = fragmentChanges;
          }
        }
      }
    });

    return changes;
  },
  configurable: true,
});

/**
 * Add helper method to update original content for fragments when model is saved
 * This should be called when the model transitions from dirty to clean state
 */
Model.prototype._updateFragmentOriginalContent = function () {
  this.eachAttribute((key, meta) => {
    if (
      meta.type === 'fragment' ||
      meta.type === 'fragment-array' ||
      meta.type === 'array'
    ) {
      const value = this.get(key);
      if (value && typeof value._updateOriginalContent === 'function') {
        value._updateOriginalContent();
      }
    }
  });
};

// Hook into the model's save lifecycle to update fragment original content
const originalSave = Model.prototype.save;
Model.prototype.save = function (options) {
  const savePromise = originalSave.call(this, options);

  // Update fragment original content after successful save
  if (savePromise && typeof savePromise.then === 'function') {
    return savePromise.then((result) => {
      this._updateFragmentOriginalContent();
      return result;
    });
  }

  return savePromise;
};

/**
 * Helper method to check if a model has any fragment attributes
 */
Model.prototype.hasFragmentAttributes = function () {
  let hasFragments = false;
  this.eachAttribute((key, meta) => {
    if (
      meta.type === 'fragment' ||
      meta.type === 'fragment-array' ||
      meta.type === 'array'
    ) {
      hasFragments = true;
    }
  });
  return hasFragments;
};

export default Model;
