import { module, test } from 'qunit';
import { setupRenderingTest } from '../helpers';
import { render, settled } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { setComponentTemplate } from '@ember/component';
import Component from '@glimmer/component';

module('Integration | Rendering', function (hooks) {
  setupRenderingTest(hooks);

  let store;

  hooks.beforeEach(function () {
    store = this.owner.lookup('service:store');
  });

  hooks.afterEach(function () {
    store = null;
  });

  test('construct fragments without autotracking.mutation-after-consumption error', async function (assert) {
    class PersonComponent extends Component {
      constructor() {
        super(...arguments);
        this.person = store.createRecord('person', {
          name: {
            first: 'Tyrion',
            last: 'Lannister',
          },
          titles: ['Hand of the King', 'Master of Coin'],
        });
      }

      willDestroy() {
        this.person.unloadRecord();
        super.willDestroy(...arguments);
      }
    }
    setComponentTemplate(hbs`{{yield this.person}}`, PersonComponent);

    this.Person = PersonComponent;
    this.show = false;

    await render(hbs`
      {{#if this.show}}
        <this.Person as |person|>
          <h3 data-name>{{person.name.first}} {{person.name.last}}</h3>
          <ul>
            {{#each person.titles as |title idx|}}
              <li data-title="{{idx}}">{{title}}</li>
            {{/each}}
          </ul>
        </this.Person>
      {{/if}}
    `);

    assert.dom().hasNoText();

    this.set('show', true);

    assert.dom('[data-name]').hasText('Tyrion Lannister');
    assert.dom('[data-title]').exists({ count: 2 });
    assert.dom('[data-title="0"]').hasText('Hand of the King');
    assert.dom('[data-title="1"]').hasText('Master of Coin');
  });

  test('fragment array computed property', async function (assert) {
    class OrderListComponent extends Component {
      get productsByPrice() {
        const { order } = this.args;
        return order.products.sortBy('price');
      }
    }
    setComponentTemplate(
      hbs`
        <ul>
          {{#each this.productsByPrice as |product idx|}}
            <li data-product="{{idx}}">{{product.name}}: {{product.price}}</li>
          {{/each}}
        </ul>
      `,
      OrderListComponent
    );

    this.OrderList = OrderListComponent;
    this.order = store.createRecord('order');

    await render(hbs`<this.OrderList @order={{this.order}}/>`);

    assert.dom('[data-product]').doesNotExist();

    this.order.products.createFragment({
      name: 'Tears of Lys',
      price: '499.99',
    });
    await settled();

    assert.dom('[data-product]').exists({ count: 1 });
    assert.dom('[data-product="0"]').hasText('Tears of Lys: 499.99');

    this.order.products.createFragment({
      name: 'The Strangler',
      price: '299.99',
    });
    await settled();

    assert.dom('[data-product]').exists({ count: 2 });
    assert.dom('[data-product="0"]').hasText('The Strangler: 299.99');
    assert.dom('[data-product="1"]').hasText('Tears of Lys: 499.99');
  });
});
