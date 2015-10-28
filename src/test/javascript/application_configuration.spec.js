/*globals describe, expect, it, require*/

/**
 * Tests objects that contain an application's configuration values.
 */

var applicationName = 'sqwerl';

var catalogDatabaseName = 'catalog';

var catalogDatabasePath = '/encrypted/sqwerl-catalog';

var clientSourcePath = '/home/sqwerl/www';

var configurationModule = require('../../main/javascript/application_configuration');

var defaultDatabaseName = 'tcarroll';

var defaultDatabasePath = '/encrypted/tcarroll';

describe('ApplicationConfiguration', function () {
    'use strict';
    it('Application configuration from object works', function () {
        var configuration =
            configurationModule.newInstanceFromObject({
                'applicationName': applicationName,
                'catalogDatabaseName': catalogDatabaseName,
                'catalogDatabasePath': catalogDatabasePath,
                'clientSourcePath': clientSourcePath,
                'defaultDatabaseName': defaultDatabaseName,
                'defaultDatabasePath': defaultDatabasePath
            });
        expect(configuration).not.toBeNull();
        expect(configuration.applicationName).toEqual(applicationName);
        expect(configuration.catalogDatabaseName).toEqual(catalogDatabaseName);
        expect(configuration.catalogDatabasePath).toEqual(catalogDatabasePath);
        expect(configuration.clientSourcePath).toEqual(clientSourcePath);
        expect(configuration.defaultDatabaseName).toEqual(defaultDatabaseName);
        expect(configuration.defaultDatabasePath).toEqual(defaultDatabasePath);
    });

    it('Application configuration from object requires non-null object', function () {
        var m = function () {
            configurationModule.newInstanceFromObject(null);
        };
        expect(m).toThrow();
    });

    it('Application name must not be null', function () {
        var m = function () {
            configurationModule.newInstanceFromObject({
                'catalogDatabaseName': catalogDatabaseName,
                'catalogDatabasePath': catalogDatabasePath,
                'clientSourcePath': clientSourcePath,
                'defaultDatabaseName': defaultDatabaseName,
                'defaultDatabasePath': defaultDatabasePath
            });
        };
        expect(m).toThrow();
    });

    it('Application name must not be empty', function () {
        var m = function () {
            configurationModule.newInstanceFromObject({
                'applicationName': '',
                'catalogDatabaseName': catalogDatabaseName,
                'catalogDatabasePath': catalogDatabasePath,
                'clientSourcePath': clientSourcePath,
                'defaultDatabaseName': defaultDatabaseName,
                'defaultDatabasePath': defaultDatabasePath
            });
        };
        expect(m).toThrow();
    });

    it('Catalog database name must not be null', function () {
        var m = function () {
            configurationModule.newInstanceFromObject({
                'applicationName': applicationName,
                'catalogDatabasePath': catalogDatabasePath,
                'clientSourcePath': clientSourcePath,
                'defaultDatabaseName': defaultDatabaseName,
                'defaultDatabasePath': defaultDatabasePath
            });
        };
        expect(m).toThrow();
    });

    it('Catalog database name must not be empty', function () {
        var m = function () {
            configurationModule.newInstanceFromObject({
                'applicationName': applicationName,
                'catalogDatabaseName': '',
                'catalogDatabasePath': catalogDatabasePath,
                'clientSourcePath': clientSourcePath,
                'defaultDatabaseName': defaultDatabaseName,
                'defaultDatabasePath': defaultDatabasePath
            });
        };
        expect(m).toThrow();
    });

    it('Catalog database path cannot be null', function () {
        var m = function () {
            configurationModule.newInstanceFromObject({
                'applicationName': applicationName,
                'catalogDatabaseName': catalogDatabaseName,
                'clientSourcePath': clientSourcePath,
                'defaultDatabaseName': defaultDatabaseName,
                'defaultDatabasePath': defaultDatabasePath
            });
        };
        expect(m).toThrow();
    });

    it('Catalog database path cannot be empty', function () {
        var m = function () {
            configurationModule.newInstanceFromObject({
                'applicationName': applicationName,
                'catalogDatabaseName': catalogDatabaseName,
                'catalogDatabasePath': '',
                'clientSourcePath': clientSourcePath,
                'defaultDatabaseName': defaultDatabaseName,
                'defaultDatabasePath': defaultDatabasePath
            });
        };
        expect(m).toThrow();
    });

    it('Default database name cannot be null', function () {
        var m = function () {
            configurationModule.newInstanceFromObject({
                'applicationName': applicationName,
                'catalogDatabaseName': catalogDatabaseName,
                'catalogDatabasePath': catalogDatabasePath,
                'clientSourcePath': clientSourcePath,
                'defaultDatabasePath': defaultDatabasePath
            });
        };
        expect(m).toThrow();
    });

    it('Default database name cannot be empty', function () {
        var m = function () {
            configurationModule.newInstanceFromObject({
                'applicationName': applicationName,
                'catalogDatabaseName': catalogDatabaseName,
                'catalogDatabasePath': catalogDatabasePath,
                'clientSourcePath': clientSourcePath,
                'defaultDatabaseName': '',
                'defaultDatabasePath': defaultDatabasePath
            });
        };
        expect(m).toThrow();
    });

    it('Default database path cannot be null', function () {
        var m = function () {
            configurationModule.newInstanceFromObject({
                'applicationName': applicationName,
                'catalogDatabaseName': catalogDatabaseName,
                'catalogDatabasePath': catalogDatabasePath,
                'clientSourcePath': clientSourcePath,
                'defaultDatabaseName': defaultDatabaseName
            });
        };
        expect(m).toThrow();
    });

    it('Default database path cannot be empty', function () {
        var m = function () {
            configurationModule.newInstanceFromObject({
                'applicationName': applicationName,
                'catalogDatabaseName': catalogDatabaseName,
                'catalogDatabasePath': catalogDatabasePath,
                'clientSourcePath': clientSourcePath,
                'defaultDatabaseName': defaultDatabaseName,
                'defaultDatabasePath': ''
            });
        };
        expect(m).toThrow();
    });

    it('Client source path cannot be null', function () {
        var m = function () {
            configurationModule.newInstanceFromObject({
                'applicationName': applicationName,
                'catalogDatabaseName': catalogDatabaseName,
                'catalogDatabasePath': catalogDatabasePath,
                'defaultDatabaseName': defaultDatabaseName,
                'defaultDatabasePath': defaultDatabasePath
            });
        };
        expect(m).toThrow();
    });

    it('Client source path cannot be empty', function () {
        var m = function () {
            configurationModule.newInstanceFromObject({
                'applicationName': applicationName,
                'catalogDatabaseName': catalogDatabaseName,
                'catalogDatabasePath': catalogDatabasePath,
                'clientSourcePath': '',
                'defaultDatabaseName': defaultDatabaseName,
                'defaultDatabasePath': defaultDatabasePath
            });
        };
        expect(m).toThrow();
    });

    it('All required configuration parameters have been set', function () {
        return function () {
            configurationModule.newInstanceFromObject({
                'applicationName': applicationName,
                'catalogDatabaseName': catalogDatabaseName,
                'catalogDatabasePath': catalogDatabasePath,
                'defaultDatabaseName': defaultDatabaseName,
                'defaultDatabasePath': defaultDatabasePath,
                'clientSourcePath': clientSourcePath
            });
        };
    });

    it('Initializing from file requires a non-null file name', function () {
        var m = function () {
            configurationModule.newInstanceFromFile(null);
        };
        expect(m).toThrow();
    });

    it('Initializing from a file requires a non empty file name', function () {
        var m = function () {
            configurationModule.newInstanceFromFile('');
        };
        expect(m).toThrow();
    });

    it('Initializing from a file requires a string file name', function () {
        var m = function () {
            configurationModule.newInstanceFromFile({ });
        };
        expect(m).toThrow();
    });

    it('Can initialize from file', function () {
        configurationModule.newInstanceFromFile('src/test/resources/test_configuration.json');
    });
});