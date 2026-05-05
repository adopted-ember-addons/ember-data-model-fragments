import Route from '@ember/routing/route';
import { service } from '@ember/service';
import { PEOPLE_SEED, personPayload } from '../seed.ts';

import type Store from '../services/store.ts';
import type Person from '../models/person.ts';

export default class ApplicationRoute extends Route {
  @service declare store: Store;

  model(): Person[] {
    this.store.unloadAll('person');
    this.store.push({ data: PEOPLE_SEED.map(personPayload) });
    const people = this.store.peekAll('person') as unknown as Person[];
    // Pre-materialize fragments so first render only reads stable values.
    for (const person of people) {
      void person.name;
      void person.addresses;
      void person.hobbies;
      void person.titles;
    }
    return people;
  }
}
