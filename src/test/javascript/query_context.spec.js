/*globals describe, expect, it, require*/

var configuration = require('../../main/javascript/application_configuration').newInstanceFromFile('src/test/resources/test_configuration.json');

var databaseModule = require('../../main/javascript/database');

var database = databaseModule.newInstance('test', 'test-db', null, 'src/test/resources/sqwerl-catalog');

var queryContext = require('../../main/javascript/query_context');

var request = {
    'url': '/applicationName/databaseName/types'
};

var resourceId = '/types/users/Administrator';

var response = {};

/**
 * @type QueryResultsHandler
 */
var resultsHandler = { };

/**
 * @type {string}
 */
var userId = '/types/users/Administrator';

describe('query_context', function () {
    'use strict';
    it('Can create and initialize a valid query context', function () {
        var context = queryContext.newInstance(configuration, resultsHandler, request, response, database, resourceId, userId, true, true);
        expect(context).not.toBeNull();
        expect(context.resultsHandler).toEqual(resultsHandler);
        expect(context.request).toEqual(request);
        expect(context.response).toEqual(response);
        expect(context.database).toEqual(database);
        expect(context.resourceId).toEqual(userId);
        expect(context.userId).toEqual(userId);
        expect(context.isMetadataQuery).toEqual(true);
        expect(context.isSummaryQuery).toEqual(true);
    });
    it('Can\'t construct a query context within a results handler', function () {
        var constructor = function () {
            queryContext.newInstance(configuration, null, request, response, database, userId, userId, true, true);
        };
        expect(constructor).toThrow();
    });
    it('Can\'t construct a query context without a Web request', function () {
        var constructor = function () {
            queryContext.newInstance(configuration, resultsHandler, null, response, database, resourceId, userId, true, true);
        };
        expect(constructor).toThrow();
    });
    it('Can\'t construct a query context without a Web response.', function () {
        var constructor = function () {
            queryContext.newInstance(configuration, resultsHandler, request, null, database, resourceId, userId, true, true);
        };
        expect(constructor).toThrow();
    });
    it('Can\'t construct a query context without a database', function () {
        var constructor = function () {
            queryContext.newInstance(configuration, resultsHandler, request, response, null, resourceId, userId, true, true);
        };
        expect(constructor).toThrow();
    });
    it('Can\'t construct a query context without a resource ID', function () {
        var constructor = function () {
            queryContext.newInstance(configuration, resultsHandler, request, response, database, null, userId, true, true);
        };
        expect(constructor).toThrow();
    });
    it('Can\'t construct a query context without a user ID', function () {
        var constructor = function () {
            queryContext.newInstance(configuration, resultsHandler, request, response, database, resourceId, null, true, true);
        };
        expect(constructor).toThrow();
    });
});