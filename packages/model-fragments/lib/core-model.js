import Ember from 'ember';
import Model from './model';

/**
  @module ember-data.model-fragments
*/

// Ember object prototypes are lazy-loaded
Model.proto();

// TODO: is it easier to extend from DS.Model and disable functionality than to
// cherry-pick common functionality?
var protoProps = [
  '_setup',
  '_unhandledEvent',
  '_createSnapshot',
  'send',
  'transitionTo',
  'isEmpty',
  'isLoading',
  'isLoaded',
  'isDirty',
  'isSaving',
  'isDeleted',
  'isNew',
  'isValid',
  'serialize',
  'changedAttributes',
  'eachAttribute',
  'fragmentDidDirty',
  'fragmentDidReset',
  'rollbackFragments'
].reduce(function(props, name) {
  props[name] = Model.prototype[name] || Ember.meta(Model.prototype).descs[name];
  return props;
}, {});

var classProps = [
  'attributes',
  'eachAttribute',
  'transformedAttributes',
  'eachTransformedAttribute'
].reduce(function(props, name) {
  props[name] = Model[name] || Ember.meta(Model).descs[name];
  return props;
}, {});

/**
  CoreModel is a base model class that has state management, but no relation or
  persistence logic.

  @class CoreModel
*/
var CoreModel = Ember.Object.extend(protoProps, {
  eachRelationship: Ember.K,
  updateRecordArraysLater: Ember.K
});

CoreModel.reopenClass(classProps, {
  eachRelationship: Ember.K
});

export default CoreModel;
