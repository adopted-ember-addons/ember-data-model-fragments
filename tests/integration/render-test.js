import { module, test } from 'qunit';
import { setupRenderingTest } from '../helpers';
import { render, settled } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { setComponentTemplate } from '@ember/component';
import Component from '@glimmer/component';
import Pretender from 'pretender';

module('Integration | Rendering', function (hooks) {
  setupRenderingTest(hooks);

  let store, server;

  hooks.beforeEach(function () {
    store = this.owner.lookup('service:store');
    server = new Pretender();
  });

  hooks.afterEach(function () {
    store = null;
    server.shutdown();
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

  test('fragment array data pushed', async function (assert) {
    this.order = store.createRecord('order', { id: 'an-id' });

    await render(
      hbs`
        Orders
        <ul>
          {{#each this.order.products as |product idx|}}
            <li data-product="{{idx}}">{{product.name}}: {{product.price}}</li>
          {{/each}}
        </ul>
      `
    );

    assert.dom('[data-product]').doesNotExist();

    store.push({
      data: [
        {
          id: this.order.id,
          type: 'order',
          attributes: {
            products: [
              {
                name: 'Tears of Lys',
                price: '499.99',
              },
            ],
          },
          relationships: {},
        },
      ],
    });

    await settled();

    assert.dom('[data-product]').exists({ count: 1 });
    assert.dom('[data-product="0"]').hasText('Tears of Lys: 499.99');

    store.push({
      data: [
        {
          id: this.order.id,
          type: 'order',
          attributes: {
            products: [
              {
                name: 'The Strangler',
                price: '299.99',
              },
              {
                name: 'Tears of Lys',
                price: '499.99',
              },
            ],
          },
          relationships: {},
        },
      ],
    });

    await settled();

    assert.dom('[data-product]').exists({ count: 2 });
    assert.dom('[data-product="0"]').hasText('The Strangler: 299.99');
    assert.dom('[data-product="1"]').hasText('Tears of Lys: 499.99');

    store.push({
      data: [
        {
          id: this.order.id,
          type: 'order',
          attributes: {
            products: [
              {
                name: 'The Strangler',
                price: '299.99',
              },
            ],
          },
          relationships: {},
        },
      ],
    });

    await settled();

    assert.dom('[data-product]').exists({ count: 1 });
    assert.dom('[data-product="0"]').hasText('The Strangler: 299.99');
  });

  test('fragment is destroyed', async function (assert) {
    this.order = store.createRecord('order', { id: 1 });

    store.push({
      data: [
        {
          id: this.order.id,
          type: 'order',
          attributes: {
            product: {
              name: 'The Strangler',
              price: '299.99',
            },
          },
          relationships: {},
        },
      ],
    });

    await render(hbs`
      {{#let this.order.product as |product|}}
        <span data-product>{{product.name}}: {{product.price}}</span>
      {{/let}}
    `);

    assert.dom('[data-product]').hasText('The Strangler: 299.99');

    server.delete('/orders/1', () => [204]);
    await this.order.destroyRecord();

    assert.dom('[data-product]').hasText('The Strangler: 299.99');
  });

  test('fragment array is destroyed', async function (assert) {
    this.order = store.createRecord('order', { id: 1 });

    store.push({
      data: [
        {
          id: this.order.id,
          type: 'order',
          attributes: {
            products: [
              {
                name: 'The Strangler',
                price: '299.99',
              },
              {
                name: 'Tears of Lys',
                price: '499.99',
              },
            ],
          },
          relationships: {},
        },
      ],
    });

    await render(hbs`
      <ul>
        {{#each this.order.products as |product idx|}}
          <li data-product="{{idx}}">{{product.name}}: {{product.price}}</li>
        {{/each}}
      </ul>
    `);

    assert.dom('[data-product]').exists({ count: 2 });
    assert.dom('[data-product="0"]').hasText('The Strangler: 299.99');
    assert.dom('[data-product="1"]').hasText('Tears of Lys: 499.99');

    server.delete('/orders/1', () => [204]);
    await this.order.destroyRecord();

    assert.dom('[data-product]').exists({ count: 2 });
    assert.dom('[data-product="0"]').hasText('The Strangler: 299.99');
    assert.dom('[data-product="1"]').hasText('Tears of Lys: 499.99');
  });

  test('array destroyed', async function (assert) {
    this.person = store.createRecord('person', { id: 1 });

    store.push({
      data: [
        {
          id: this.person.id,
          type: 'person',
          attributes: {
            titles: ['Hand of the King', 'Master of Coin'],
          },
          relationships: {},
        },
      ],
    });

    await render(hbs`
      <ul>
        {{#each this.person.titles as |title idx|}}
          <li data-title="{{idx}}">{{title}}</li>
        {{/each}}
      </ul>
    `);

    assert.dom('[data-title]').exists({ count: 2 });
    assert.dom('[data-title="0"]').hasText('Hand of the King');
    assert.dom('[data-title="1"]').hasText('Master of Coin');

    server.delete('/people/1', () => [204]);
    await this.person.destroyRecord();

    assert.dom('[data-title]').exists({ count: 2 });
    assert.dom('[data-title="0"]').hasText('Hand of the King');
    assert.dom('[data-title="1"]').hasText('Master of Coin');
  });
});
