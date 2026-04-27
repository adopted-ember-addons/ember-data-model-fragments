// @ts-nocheck -- incremental TS conversion; types will be tightened in follow-up PRs.
import { FragmentJSONAPISerializer } from '#src/serializer.ts';

export default class extends FragmentJSONAPISerializer {
  serialize(snapshot, ...args) {
    const data = super.serialize(snapshot, ...args);
    const { record } = snapshot;

    if (data.data?.attributes) {
      // NOTICE: Remove all the unchanged attributes in the payload.
      const changedAttributes = Object.keys(record.changedAttributes());

      Object.keys(data.data.attributes).forEach((attributeName) => {
        if (!changedAttributes.includes(attributeName)) {
          delete data.data.attributes[attributeName];
        }
      });
    }

    return data;
  }
}
