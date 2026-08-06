import { FragmentJSONAPISerializer } from '#src/serializer.ts';
import type Model from '@ember-data/model';

interface SerializeSnapshot {
  record: Model;
}

interface JSONAPIResourceDocument {
  data?: {
    attributes?: Record<string, unknown>;
  };
}

export default class extends FragmentJSONAPISerializer {
  serialize(snapshot: SerializeSnapshot, options?: object): object {
    const data = super.serialize(snapshot, options) as JSONAPIResourceDocument;
    const { record } = snapshot;

    const attributes = data.data?.attributes;
    if (attributes) {
      // NOTICE: Remove all the unchanged attributes in the payload.
      const changedAttributes = Object.keys(record.changedAttributes());

      Object.keys(attributes).forEach((attributeName) => {
        if (!changedAttributes.includes(attributeName)) {
          delete attributes[attributeName];
        }
      });
    }

    return data;
  }
}
