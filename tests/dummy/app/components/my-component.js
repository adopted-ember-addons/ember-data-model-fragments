import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';

export default class MyComponent extends Component {
  @service store;
  @tracked record = this.store.createRecord('my-model', { name: 'test', fragments: [] })
}
