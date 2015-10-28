/*globals describe, expect, it, toBe, require*/

var router = require('../../main/javascript/router');

describe('router', function () {
    'use strict';
    it('Router properly configured.', function () {
        var configuration = {
                'applicationName': 'test',
                'catalogDatabaseName': 'sqwerl-catalog',
                'catalogDatabasePath': 'src/test/resources/sqwerl-catalog',
                'clientSourcePath': 'resources',
                'defaultDatabaseName': 'default',
                'defaultDatabasePath': 'src/test/resources/default'
            },
            r = new router.Router(configuration);
        expect(r.catalogDatabaseName).toBe(configuration.catalogDatabaseName);
        expect(r.clientSourcePath).toBe(configuration.clientSourcePath);
    });
});