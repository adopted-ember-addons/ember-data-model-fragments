// @ts-nocheck -- incremental TS conversion; types will be tightened in follow-up PRs.
import RESTAdapter from '@ember-data/adapter/rest';

export default class ApplicationAdapter extends RESTAdapter {
  shouldBackgroundReloadRecord() {
    return false;
  }
}
