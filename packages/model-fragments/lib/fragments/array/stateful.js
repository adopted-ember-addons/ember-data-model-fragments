import Ember from 'ember';

var get = Ember.get;
var set = Ember.set;
var splice = Array.prototype.splice;

//
// State-aware Arrays
//

var StatefulArray = Ember.ArrayProxy.extend({
  owner: null,

  name: null,

  init: function() {
    this._super();
    set(this, '_originalState', []);
  },

  content: function() {
    return Ember.A();
  }.property(),

  // Set new data array
  setupData: function(data) {
    var content = get(this, 'content');

    data = Ember.makeArray(data);
    set(this, '_originalState', data);

    // Use non-KVO mutator to prevent parent record from dirtying
    splice.apply(content, [ 0, content.length ].concat(data));
  },

  adapterDidCommit: function() {
    // Fragment array has been persisted; use the current state as the original state
    set(this, '_originalState', this.toArray());
  },

  isDirty: function() {
    return Ember.compare(this.toArray(), get(this, '_originalState')) !== 0;
  }.property('[]', '_originalState'),

  rollback: function() {
    this.setObjects(get(this, '_originalState'));
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

export default StatefulArray;
