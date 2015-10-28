/*globals exports, require*/

// TODO - Replace this implementation. You have an article with an example, consult it, and redesign.
/**
 * Caches persistent objects in memory.
 */

var converter = require('./converter'),

    logger = require('./logger').newInstance('Cache'),

    metadata = {
    },

    resources = {
    };

/**
 * Caches a value.
 *
 * @param {String}  databaseName The non-null name of the database that contains the value to cache.
 * @param {String}  resourceId   The cached data's non-null, non-empty unique identifier within the given database.
 * @param           [value]      A value to cache.
 */
function cache(databaseName, resourceId, value) {
    'use strict';
    var databaseCache = resources[databaseName];
    if (!databaseCache) {
        resources[databaseName] = {};
    }
    resources[databaseName][resourceId] = value;
}

/**
 * Executes a query against a given resource.
 *
 * @param  user        The user requesting to execute a query.
 * @param  database    The non-null database to query.
 * @param  request     The non-null client request.
 * @param  response    The response to return to the user.
 * @param  {String} resourceId  The unique identifier of the resource to query.
 */
function query(user, database, request, response, resourceId) {
    'use strict';
    var cachedObject, databaseCache = resources[database.name],
        methodName = 'query';
    if (databaseCache) {
        cachedObject = databaseCache[resourceId];
    }
    if (cachedObject) {
        logger.info(methodName, 'Found cached object for database "' + database.name + '" with ID "' + resourceId + '".');

        // ***********************************************
        // TODO: Test that the user can read the resource.
        // ***********************************************

        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.write(converter.asJson(resources[database.name][resourceId]));
        response.end();
    } else {
        database.query(database, user, request, response, resourceId);
    }
}

exports.cache = cache;
exports.query = query;