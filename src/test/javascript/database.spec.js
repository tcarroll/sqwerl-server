/*globals describe, expect, it, require*/

var applicationName = 'test';

var configuration = require('../../main/javascript/application_configuration').newInstanceFromFile('src/test/resources/test_configuration.json');

var database = require('../../main/javascript/database');

var databaseName = 'sqwerl-catalog';

var path = 'src/test/resources/sqwerl-catalog';

var queryContext = require('../../main/javascript/query_context');

var queryResultsHandler = require('../../main/javascript/query_results_handler');

var request = { url: '' };

var response = { };

describe('database', function () {
    'use strict';
    it('Can create catalog database', function () {
        var appName = 'test',
            name = 'catalog',
            path = 'src/test/resources/sqwerl-catalog',
            catalogDb = database.newInstance(appName, name, null, path),
            expectedTypeNames,
            typePaths,
            child;
        expect(catalogDb.name).toBe(name);
        expect(catalogDb.home).toBe(path);
        expect(catalogDb.fileServer).not.toBeNull();
        expect(catalogDb.query).toBeDefined();
        expect(catalogDb.types).not.toBeNull();
        expectedTypeNames = ['accounts', 'capabilities', 'databases', 'groups', 'roles', 'users'];
        typePaths = {};
        expectedTypeNames.forEach(function (typeName) {
            typePaths['</' + appName + '/' + catalogDb.name + '/types/' + typeName + '>'] = '';
console.log('typePath = \'' + '</' + appName + '/' + catalogDb.name + '/types/' + typeName + '>\'');
        });
        for (child in catalogDb.types) {
            if (catalogDb.types.hasOwnProperty(child)) {
console.log('child = \'' + child + '\'');
                expect(typePaths.hasOwnProperty(child)).toBeTruthy();
                delete typePaths[child];
            }
        }
        expect(Object.keys(typePaths).length).toBe(0);
    });
    it('Cannot create database with null application name', function () {
        var f = function () { database.newInstance(null, databaseName, null, path); };
        expect(f).toThrow();
    });
    it('Cannot create database with empty application name', function () {
        var f = function () { database.newInstance('', databaseName, null, path); };
        expect(f).toThrow();
    });
    it('Cannot create database with null name', function () {
        var f = function () { database.newInstance(applicationName, null, null, path); };
        expect(f).toThrow();
    });
    it('Cannot create database with empty name', function () {
        var f = function () { database.newInstance(applicationName, '', null, path); };
        expect(f).toThrow();
    });
    it('Cannot create database with null home path', function () {
        var f = function () { database.newInstance(applicationName, databaseName, null, null); };
        expect(f).toThrow();
    });
    it('Cannot create database with empty home path', function () {
        var f = function () { database.newInstance(applicationName, databaseName, null, ''); };
        expect(f).toThrow();
    });
});