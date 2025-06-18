import { attr } from '@ember-data/model';

/**
 * Defines a fragment attribute for a single nested object
 * 
 * @param {string} fragmentType - The name of the fragment model type
 * @param {Object} options - Additional options
 * @param {*} options.defaultValue - Default value for the fragment
 * @returns {Function} Attribute decorator
 * 
 * @example
 * ```javascript
 * import Model from '@ember-data/model';
 * import { fragment } from 'ember-data-model-fragments/attributes';
 * 
 * export default class Person extends Model {
 *   @fragment('name') name;
 *   @fragment('address', { defaultValue: {} }) address;
 * }
 * ```
 */
export function fragment(fragmentType, options = {}) {
  console.log('FRAGMENT DECORATOR CALLED:', fragmentType, options);
  
  // Log the attr function to see what it returns
  const attrDecorator = attr('fragment', {
    fragmentType,
    ...options
  });
  
  console.log('ATTR DECORATOR RETURNED:', typeof attrDecorator);
  
  return attrDecorator;
}

/**
 * Defines a fragment array attribute for multiple nested objects
 * 
 * @param {string} fragmentType - The name of the fragment model type
 * @param {Object} options - Additional options  
 * @param {Array} options.defaultValue - Default array value
 * @returns {Function} Attribute decorator
 * 
 * @example
 * ```javascript
 * import Model from '@ember-data/model';
 * import { fragmentArray } from 'ember-data-model-fragments/attributes';
 * 
 * export default class Person extends Model {
 *   @fragmentArray('address') addresses;
 *   @fragmentArray('phone', { defaultValue: [] }) phoneNumbers;
 * }
 * ```
 */
export function fragmentArray(fragmentType, options = {}) {
  return attr('fragment-array', {
    fragmentType,
    ...options
  });
}

/**
 * Defines an array attribute for primitive values
 * 
 * @param {string} [type] - The type of items in the array (optional)
 * @param {Object} options - Additional options
 * @param {Array} options.defaultValue - Default array value
 * @returns {Function} Attribute decorator
 * 
 * @example
 * ```javascript
 * import Model from '@ember-data/model';
 * import { array } from 'ember-data-model-fragments/attributes';
 * 
 * export default class Person extends Model {
 *   @array() titles;                    // Array of any type
 *   @array('string') tags;              // Array of strings
 *   @array('number') scores;            // Array of numbers
 * }
 * ```
 */
export function array(type, options = {}) {
  // Handle both array() and array('string') syntax
  if (typeof type === 'object' && Object.keys(options).length === 0) {
    options = type;
    type = undefined;
  }
  
  return attr('array', {
    itemType: type,
    ...options
  });
}
