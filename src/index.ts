import type { Store } from '@warp-drive/core';
import { getOwner } from '@ember/owner';
import type Owner from '@ember/owner';

interface StoreWithFragmentSupport extends Store {
  createFragment: (modelName: string, props: object) => unknown;
  isFragment: (modelName: string) => boolean;
}

interface StoreConstructorWithFragmentSupport {
  new (...args: any[]): StoreWithFragmentSupport;
  prototype: StoreWithFragmentSupport;
}

export function addFragmentSupportToStore(
  StoreKlass: StoreConstructorWithFragmentSupport,
) {
  StoreKlass.prototype.createFragment = function (
    this: StoreWithFragmentSupport,
    modelName: string,
    props = {},
  ) {
    if (!this.isFragment(modelName)) {
      throw new Error(`Could not find fragment class for type: ${modelName}`);
    }

    try {
      // Get the fragment factory from the container
      const owner = getOwner(this) as Owner;
      const factory = owner.factoryFor(`model:${modelName}`);

      if (!factory) {
        throw new Error(`Could not find fragment class for type: ${modelName}`);
      }

      const FragmentClass = factory.class;

      // Debug logging
      console.log(
        'Creating fragment with class:',
        FragmentClass.name,
        'modelName:',
        modelName,
      );
      console.log(
        'Fragment prototype:',
        Object.getPrototypeOf(FragmentClass.prototype),
      );
      console.log('Fragment has set:', typeof FragmentClass.prototype.set);

      // Ensure props is an object
      const safeProps = props || {};

      // Create a new instance of the fragment
      const fragment = new FragmentClass(safeProps, null, null);

      // Debug the created instance
      console.log(
        'Created fragment instanceof Fragment:',
        fragment instanceof Fragment,
      );
      console.log('fragment.set type:', typeof fragment.set);
      console.log('fragment attributes:', fragment._attributes);

      // Initialize if needed
      if (!fragment._attributes) {
        fragment._attributes = {};
        // Copy properties to attributes
        Object.keys(safeProps).forEach((key) => {
          fragment._attributes[key] = safeProps[key];
        });
      }

      // Make sure properties are properly accessible
      Object.keys(safeProps).forEach((key) => {
        if (fragment[key] === undefined) {
          Object.defineProperty(fragment, key, {
            enumerable: true,
            configurable: true,
            get() {
              return fragment._attributes[key];
            },
            set(value) {
              fragment._attributes[key] = value;
              fragment._fragmentDidChange();
              return value;
            },
          });
        }
      });

      return fragment;
    } catch (e) {
      console.error('Error creating fragment:', e);
      throw e;
    }
  };

  StoreKlass.prototype.isFragment = function (
    this: StoreWithFragmentSupport,
    modelName: string,
  ) {
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
}
