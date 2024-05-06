import Application from 'dummy/app';
import config from 'dummy/config/environment';
import * as QUnit from 'qunit';
import { setApplication } from '@ember/test-helpers';
import { setup as setupQunitDom } from 'qunit-dom';
import { setup as setupCustomAssertions } from './helpers/assertion';
import { start } from 'ember-qunit';

setApplication(Application.create(config.APP));

setupQunitDom(QUnit.assert);
setupCustomAssertions(QUnit.assert);

start();
