/**
 * Vendored from @ember-data/model/-private (removed in ember-data 5.0).
 *
 * Computes the difference between two arrays, returning an object with:
 * - firstChangeIndex: the index of the first difference (null if arrays are equal)
 * - addedCount: the number of elements added at that index
 * - removedCount: the number of elements removed at that index
 *
 * @param {Array} oldArray
 * @param {Array} newArray
 * @returns {{ firstChangeIndex: number|null, addedCount: number, removedCount: number }}
 */
export function diffArray(oldArray, newArray) {
  const oldLength = oldArray.length;
  const newLength = newArray.length;

  const shortestLength = Math.min(oldLength, newLength);
  let firstChangeIndex = null;

  // Find the first index where the arrays differ (from the start)
  for (let i = 0; i < shortestLength; i++) {
    if (oldArray[i] !== newArray[i]) {
      firstChangeIndex = i;
      break;
    }
  }

  if (firstChangeIndex === null && newLength !== oldLength) {
    // Arrays are equal up to the shortest length, but have different lengths
    firstChangeIndex = shortestLength;
  }

  if (firstChangeIndex === null) {
    // Arrays are equal
    return {
      firstChangeIndex: null,
      addedCount: 0,
      removedCount: 0,
    };
  }

  // Find the number of equal elements from the end
  let unchangedEndCount = 0;
  for (
    let oldIndex = oldLength - 1, newIndex = newLength - 1;
    oldIndex >= firstChangeIndex && newIndex >= firstChangeIndex;
    oldIndex--, newIndex--
  ) {
    if (oldArray[oldIndex] !== newArray[newIndex]) {
      break;
    }
    unchangedEndCount++;
  }

  return {
    firstChangeIndex,
    addedCount: newLength - unchangedEndCount - firstChangeIndex,
    removedCount: oldLength - unchangedEndCount - firstChangeIndex,
  };
}
