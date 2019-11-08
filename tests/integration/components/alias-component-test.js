import { run } from '@ember/runloop';
import { module, skip } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import Pretender from 'pretender';
let owner, store, server;

module('Integration | Component | alias component', function(hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function() {
    owner = this.owner;
    store = owner.lookup('service:store');
    server = new Pretender();
  });

  hooks.afterEach(function() {
    store = null;
    owner = null;
    server.shutdown();
  });

  skip('the adapter can update fragments without infinite loops when CPs are aliased more than once', function(assert) {
    let payloadBefore = {
      vehicle: {
        id: 1,
        passenger: {
          name: {
            first: 'Donna',
            last: 'Noble'
          }
        }
      }
    };

    let payloadAfter = {
      vehicle: {
        id: 1,
        passenger: {
          name: {
            first: 'Donna',
            last: 'Doctor'
          }
        }
      }
    };

    let done = assert.async();

    run(() => {
      server.get('/vehicles/:id', function() {
        return [200, { 'Content-Type': 'application/json' }, JSON.stringify(payloadBefore)];
      });

      store.findRecord('vehicle', 1).then(vehicle => {
        this.setProperties({ vehicle });
        this.render(hbs`{{alias-component model=vehicle}}`);

        this.set('vehicle.passenger.name.last', 'Doctor');
        server.put('/vehicles/:id', function() {
          return [200, { 'Content-Type': 'application/json' }, JSON.stringify(payloadAfter)];
        });

        vehicle.save().then(() => {
          assert.ok(true);
          done();
        });
      });
    });
  });
});
