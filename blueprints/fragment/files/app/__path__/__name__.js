<%= importedModules.length ? `import { ${importedModules} } from '@ember-data/model';` : '' %>
import Fragment from 'ember-data-model-fragments/fragment';

export default class <%= classifiedModuleName %> extends Fragment {
<%= attrs %>
}
