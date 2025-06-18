import { assert } from '@ember/debug';
import Store from '@ember-data/store';
import Model from '@ember-data/model';
import { getOwner } from '@ember/application';
import { isPresent } from '@ember/utils';
import Fragment from './fragment';

/**
  @module ember-data-model-fragments
*/

/**
  @class Store
  @namespace DS
*/

// Add methods to Store prototype
Store.prototype.createFragment = function(modelName, props = {}) {
  if (!this.isFragment(modelName)) {
    throw new Error(`Could not find fragment class for type: ${modelName}`);
  }

  try {
    // Get the fragment factory from the container
    const owner = getOwner(this);
    const factory = owner.factoryFor(`model:${modelName}`);
    
    if (!factory) {
      throw new Error(`Could not find fragment class for type: ${modelName}`);
    }

    const FragmentClass = factory.class;
    
    // Debug logging
    console.log('Creating fragment with class:', FragmentClass.name, 'modelName:', modelName);
    console.log('Fragment prototype:', Object.getPrototypeOf(FragmentClass.prototype));
    console.log('Fragment has set:', typeof FragmentClass.prototype.set);
    
    // Ensure props is an object
    const safeProps = props || {};
    
    // Create a new instance of the fragment
    const fragment = new FragmentClass(safeProps, null, null);
    
    // Debug the created instance
    console.log('Created fragment instanceof Fragment:', fragment instanceof Fragment);
    console.log('fragment.set type:', typeof fragment.set);
    console.log('fragment attributes:', fragment._attributes);
    
    // Initialize if needed
    if (!fragment._attributes) {
      fragment._attributes = {};
      // Copy properties to attributes
      Object.keys(safeProps).forEach(key => {
        fragment._attributes[key] = safeProps[key];
      });
    }
    
    // Make sure properties are properly accessible
    Object.keys(safeProps).forEach(key => {
      if (fragment[key] === undefined) {
        Object.defineProperty(fragment, key, {
          enumerable: true,
          configurable: true,
          get() { return fragment._attributes[key]; },
          set(value) { 
            fragment._attributes[key] = value;
            fragment._fragmentDidChange();
            return value;
          }
        });
      }
    });
    
    return fragment;
  } catch (e) {
    console.error('Error creating fragment:', e);
    throw e;
  }
};

Store.prototype.isFragment = function(modelName) {
  if (modelName === 'application' || modelName === '-default') {
    return false;
  }

  try {
    const type = this.modelFor(modelName);
    
    // More robust checking method
    // 1. Check if it's literally our Fragment class
    if (type === Fragment) {
      return true;
    }
    
    // 2. Check inheritance chain
    if (type && type.prototype instanceof Fragment) {
      return true;
    }
    
    // 3. Check for static modelName property pattern used by fragments
    if (type && type.modelName && !type.modelFor) {
      // If it has modelName but not modelFor (Model static method),
      // it's likely a fragment
      return true;
    }
    
    return false;
  } catch (e) {
    return false;
  }
};

// Store original methods so we can call them
const originalRollbackAttributes = Model.prototype.rollbackAttributes;
const originalHasDirtyAttributes = Object.getOwnPropertyDescriptor(
  Model.prototype,
  'hasDirtyAttributes'
);
const originalChangedAttributes = Object.getOwnPropertyDescriptor(
  Model.prototype,
  'changedAttributes'
);

/**
 * Add createFragment method to all DS.Model instances
 */
Model.prototype.createFragment = function (type, data = {}) {
  const store = this.store;
  
  if (!store) {
    throw new Error('Could not access store to create fragment');
  }
  
  const fragment = store.createFragment(type, data);
  
  // Set the owner to support dirty tracking propagation
  if (fragment) {
    fragment._owner = this;
  }
  
  return fragment;
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
  configurable: true
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
          typeof value.changedAttributes === 'function'
        ) {
          const fragmentChanges = value.changedAttributes();
          if (Object.keys(fragmentChanges).length > 0) {
            changes[key] = fragmentChanges;
          }
        }
      }
    });

    return changes;
  },
  configurable: true
});

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

export { Store, Model };
