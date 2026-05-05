import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { on } from '@ember/modifier';
import { fn } from '@ember/helper';

import type Person from '../models/person.ts';

export interface PersonRowSignature {
  Args: { person: Person };
  Element: HTMLTableRowElement;
}

export default class PersonRow extends Component<PersonRowSignature> {
  @tracked editing = false;

  get person(): Person {
    return this.args.person;
  }

  get name(): { first: string; last: string } {
    return (this.person.name ?? { first: '', last: '' }) as {
      first: string;
      last: string;
    };
  }

  get fullName(): string {
    return `${this.name.first ?? ''} ${this.name.last ?? ''}`.trim();
  }

  get addressCount(): number {
    return ((this.person.addresses as unknown[]) ?? []).length;
  }

  get hobbyCount(): number {
    return ((this.person.hobbies as unknown[]) ?? []).length;
  }

  startEdit = () => {
    this.editing = true;
  };

  cancelEdit = () => {
    this.person.rollbackAttributes();
    this.editing = false;
  };

  saveEdit = () => {
    this.editing = false;
  };

  remove = () => {
    this.person.deleteRecord();
    this.person.unloadRecord();
  };

  setPersonAttr = (key: 'title' | 'nickName', event: Event) => {
    (this.person as unknown as Record<string, string>)[key] = (
      event.target as HTMLInputElement
    ).value;
  };

  setNameAttr = (key: 'first' | 'last', event: Event) => {
    (this.name as unknown as Record<string, string>)[key] = (
      event.target as HTMLInputElement
    ).value;
  };

  <template>
    <tr ...attributes>
      <td>{{this.person.id}}</td>
      {{#if this.editing}}
        <td>
          <input
            aria-label="title"
            value={{this.person.title}}
            {{on "input" (fn this.setPersonAttr "title")}}
          />
        </td>
        <td>
          <div class="row">
            <input
              aria-label="first name"
              placeholder="first"
              value={{this.name.first}}
              {{on "input" (fn this.setNameAttr "first")}}
            />
            <input
              aria-label="last name"
              placeholder="last"
              value={{this.name.last}}
              {{on "input" (fn this.setNameAttr "last")}}
            />
          </div>
        </td>
        <td>
          <input
            aria-label="nickname"
            value={{this.person.nickName}}
            {{on "input" (fn this.setPersonAttr "nickName")}}
          />
        </td>
        <td>{{this.addressCount}}</td>
        <td>{{this.hobbyCount}}</td>
        <td>
          <div class="row">
            <button type="button" {{on "click" this.saveEdit}}>Save</button>
            <button type="button" {{on "click" this.cancelEdit}}>Cancel</button>
          </div>
        </td>
      {{else}}
        <td>{{this.person.title}}</td>
        <td>{{this.fullName}}</td>
        <td>{{this.person.nickName}}</td>
        <td>{{this.addressCount}}</td>
        <td>{{this.hobbyCount}}</td>
        <td>
          <div class="row">
            <button type="button" {{on "click" this.startEdit}}>Edit</button>
            <button
              type="button"
              class="btn btn--danger"
              {{on "click" this.remove}}
            >
              Remove
            </button>
          </div>
        </td>
      {{/if}}
    </tr>
  </template>
}
