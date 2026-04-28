import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { service } from '@ember/service';
import { on } from '@ember/modifier';
import { fn } from '@ember/helper';

import type Store from '../services/store.ts';

export interface AddPersonFormSignature {
  Element: HTMLFormElement;
}

export default class AddPersonForm extends Component<AddPersonFormSignature> {
  @service declare store: Store;

  @tracked title = '';
  @tracked nickName = '';
  @tracked first = '';
  @tracked last = '';

  setField = (key: 'title' | 'nickName' | 'first' | 'last', event: Event) => {
    this[key] = (event.target as HTMLInputElement).value;
  };

  submit = (event: SubmitEvent) => {
    event.preventDefault();
    const id = String(Date.now());
    this.store.push({
      data: {
        type: 'person',
        id,
        attributes: {
          title: this.title,
          nickName: this.nickName,
          name: { first: this.first, last: this.last },
          addresses: [],
          titles: [],
          hobbies: [],
        },
      },
    });
    // Pre-materialize fragments before the table renders the new row.
    const created = this.store.peekRecord('person', id) as {
      name: unknown;
      addresses: unknown;
      hobbies: unknown;
      titles: unknown;
    } | null;
    if (created) {
      void created.name;
      void created.addresses;
      void created.hobbies;
      void created.titles;
    }
    this.title = '';
    this.nickName = '';
    this.first = '';
    this.last = '';
    (event.target as HTMLFormElement).reset();
  };

  <template>
    <form class="form" {{on "submit" this.submit}} ...attributes>
      <h3>Add a person</h3>
      <div class="row">
        <label>
          First name
          <input
            required
            value={{this.first}}
            {{on "input" (fn this.setField "first")}}
          />
        </label>
        <label>
          Last name
          <input
            required
            value={{this.last}}
            {{on "input" (fn this.setField "last")}}
          />
        </label>
      </div>
      <div class="row">
        <label>
          Title
          <input
            value={{this.title}}
            {{on "input" (fn this.setField "title")}}
          />
        </label>
        <label>
          Nickname
          <input
            value={{this.nickName}}
            {{on "input" (fn this.setField "nickName")}}
          />
        </label>
      </div>
      <div class="actions">
        <button type="submit">Add</button>
        <button type="reset">Clear</button>
      </div>
    </form>
  </template>
}
