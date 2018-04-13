import { module, test } from 'qunit';

// Public modules / packages
import MF from 'ember-data-model-fragments';
import FragmentArray from 'ember-data-model-fragments/array/fragment';
import StatefulArray from 'ember-data-model-fragments/array/stateful';
import {
  fragment, fragmentArray, array, fragmentOwner
} from 'ember-data-model-fragments/attributes';
import ArrayTransform from 'ember-data-model-fragments/transforms/array';
import FragmentArrayTransform from 'ember-data-model-fragments/transforms/fragment-array';
import FragmentTransform from 'ember-data-model-fragments/transforms/fragment';
import Fragment from 'ember-data-model-fragments/fragment';
import version from 'ember-data-model-fragments/version';

module('model-fragments shim module', function() {
  test('test the shim modules', function(assert) {
    // Using `require` directly seems to cause Babel 6 weirdness.
    const require = window.require;

    assert.equal(require('model-fragments').default, MF);
    assert.equal(require('model-fragments/array/fragment').default, FragmentArray);
    assert.equal(require('model-fragments/array/stateful').default, StatefulArray);
    assert.equal(require('model-fragments/transforms/array').default, ArrayTransform);
    assert.equal(require('model-fragments/transforms/fragment-array').default, FragmentArrayTransform);
    assert.equal(require('model-fragments/transforms/fragment').default, FragmentTransform);
    assert.equal(require('model-fragments/attributes').fragment, fragment);
    assert.equal(require('model-fragments/attributes').fragmentArray, fragmentArray);
    assert.equal(require('model-fragments/attributes').array, array);
    assert.equal(require('model-fragments/attributes').fragmentOwner, fragmentOwner);
    assert.equal(require('model-fragments/fragment').default, Fragment);
    assert.equal(require('model-fragments/version').default, version);

    assert.expectDeprecation();
  });
});
