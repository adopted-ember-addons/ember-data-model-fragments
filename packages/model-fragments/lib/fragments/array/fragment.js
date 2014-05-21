import Ember from 'ember';
import PrimitiveArray from './primitive';

var get = Ember.get;
var map = Ember.EnumerableUtils.map;

//
// Fragment Arrays
//

var FragmentArray = PrimitiveArray.extend({
  type: null,

  // Initialize/merge fragments with data array
  setupData: function(data) {
    var record = get(this, 'owner');
    var store = get(record, 'store');
    var type = get(this, 'type');
    var key = get(this, 'name');
    var content = get(this, 'content');

    // Map data to existing fragments and create new ones where necessary
    data = map(Ember.makeArray(data), function(data, i) {
      var fragment = content[i];

      if (!fragment) {
        fragment = store.buildFragment(type);

        fragment.setProperties({
          _owner : record,
          _name  : key
        });
      }

      fragment.setupData(data);

      return fragment;
    });

    this._super(data);
  },

  adapterDidCommit: function() {
    this._super();

    // Notify all records of commit
    this.invoke('adapterDidCommit');
  },

  isDirty: function() {
    return this._super() || this.isAny('isDirty');
  }.property('@each.isDirty', '_originalState'),

  rollback: function() {
    this._super();
    this.invoke('rollback');
  },

  serialize: function() {
    return this.invoke('serialize');
  },

  // All array manipulation methods end up using this method, which
  // is a good place to ensure fragments have the correct props set
  replaceContent: function(idx, amt, fragments) {
    var record = get(this, 'owner');
    var store = get(record, 'store');
    var type = get(this, 'type');
    var key = get(this, 'name');
    var originalState = this.originalState;

    // Ensure all fragments have their owner/name set
    if (fragments) {
      fragments.forEach(function(fragment) {
        var owner = get(fragment, '_owner');

        Ember.assert("You can only add '" + type + "' fragments to this property", fragment instanceof store.modelFor(type));
        Ember.assert("Fragments can only belong to one owner, try copying instead", !owner || owner === record);

        if (!owner) {
          fragment.setProperties({
            _owner : record,
            _name  : key
          });
        }
      });
    }

    return get(this, 'content').replace(idx, amt, fragments);
  },

  addFragment: function(fragment) {
    return this.addObject(fragment);
  },

  removeFragment: function(fragment) {
    return this.removeObject(fragment);
  },

  createFragment: function(props) {
    var record = get(this, 'owner');
    var store = get(record, 'store');
    var type = get(this, 'type');
    var fragment = store.createFragment(type, props);

    return this.pushObject(fragment);
  }
});

export default FragmentArray;
