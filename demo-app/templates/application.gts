import { pageTitle } from 'ember-page-title';
import PeopleTable from '../components/people-table.gts';
import AddPersonForm from '../components/add-person-form.gts';

import type Person from '../models/person.ts';
import type { TOC } from '@ember/component/template-only';

export interface ApplicationTemplateSignature {
  Args: { model: Person[] };
}

<template>
  {{pageTitle "ember-data-model-fragments"}}

  <main class="app">
    <h2 id="title">ember-data-model-fragments demo</h2>
    <p class="intro">
      Browse persisted people in the table below. Use the form to add a new
      record. Each row's
      <strong>Remove</strong>
      button deletes that person from the store.
    </p>
    <PeopleTable @people={{@model}} />
    <AddPersonForm />
  </main>

  {{outlet}}
</template> satisfies TOC<ApplicationTemplateSignature>;
