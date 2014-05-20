import Ember from 'ember';
var get = Ember.get;
var splice = Array.prototype.splice;

//
// Primitive Arrays
//

var PrimitiveArray = Ember.ArrayProxy.extend({
  owner: null,

  name: null,

  init: function() {
    this._super();
    this.originalState = [];
  },

  content: function() {
    return Ember.A();
  }.property(),

  // Set new data array
  setupData: function(data) {
    var content = get(this, 'content');

    data = this.originalState = Ember.makeArray(data);

    // Use non-KVO mutator to prevent parent record from dirtying
    splice.apply(content, [ 0, content.length ].concat(data));
  },

  isDirty: function() {
    return Ember.compare(this.toArray(), this.originalState) !== 0;
  }.property('[]'),

  rollback: function() {
    this.setObjects(this.originalState);
  },

  serialize: function() {
    return this.toArray();
  },

  // Any change to the size of the fragment array means a potential state change
  arrayContentDidChange: function() {
    this._super.apply(this, arguments);

    var record = get(this, 'owner');
    var key = get(this, 'name');

    if (this.get('isDirty')) {
      record.fragmentDidDirty(key, this);
    } else {
      record.fragmentDidReset(key, this);
    }
  },

  toStringExtension: function() {
    return 'owner(' + get(this, 'owner.id') + ')';
  }
});

export default PrimitiveArray;
