import DS from 'ember-data';

export default DS.JSONSerializer.extend({
  normalize(modelClass, resourceHash) {
    let result = this._super(modelClass, resourceHash);
    if (resourceHash._normalizeBackendTypeTo$Type) {
      Object.assign(result.data.attributes, resourceHash, {
        $type: `${resourceHash.backendType}`
      });
    }
    return result;
  }
});
