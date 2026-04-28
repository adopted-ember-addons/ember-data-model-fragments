import PersonRow from './person-row.gts';

import type Person from '../models/person.ts';
import type { TOC } from '@ember/component/template-only';

export interface PeopleTableSignature {
  Args: { people: Person[] };
  Element: HTMLTableElement;
}

const PeopleTable: TOC<PeopleTableSignature> = <template>
  <table class="table" ...attributes>
    <thead>
      <tr>
        <th>ID</th>
        <th>Title</th>
        <th>Name</th>
        <th>Nickname</th>
        <th>Addresses</th>
        <th>Hobbies</th>
        <th aria-label="actions"></th>
      </tr>
    </thead>
    <tbody>
      {{#each @people as |person|}}
        <PersonRow @person={{person}} />
      {{else}}
        <tr>
          <td colspan="7" class="empty">No people yet.</td>
        </tr>
      {{/each}}
    </tbody>
  </table>
</template>;

export default PeopleTable;
