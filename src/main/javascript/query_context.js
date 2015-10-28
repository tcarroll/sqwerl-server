/*globals exports, require*/

var logger = require('./logger').newInstance('QueryContext'),

    resource = require('./resource'),

    url = require('url');

/**
 * Checks if the given value is truthy, and throws an error if not.
 *
 * @param {*} value             Value to check.
 * @param {string} [message]    Optional error message for when the given value isn't truthy.
 */
function assertTrue(value, message) {
    'use strict';
    if (!value) {
        throw new Error(message);
    }
}

/**
 * Returns a new, initialized context for a database query.
 *
 * @param {ApplicationConfiguration} configuration  Required application configuration settings.
 * @param {QueryResultsHandler} resultsHandler      Required handler notified when a database returns query results.
 * @param request                                   Required web request.
 * @param response                                  Required response to web client.
 * @param {Database} database                       Required database of persistent things.
 * @param {string} resourceId                       Required unique resource identifier of a persistent thing to query.
 * @param {string} userId                           Required unique resource identifier of the user performing a database query.
 * @param {boolean} isMetadataQuery                 Is the user querying type information (metadata: data about data)?
 * @param {boolean} isSummaryQuery                  Is the user requesting summarized results?
 * @constructor
 */
function QueryContext(configuration, resultsHandler, request, response, database, resourceId, userId, isMetadataQuery, isSummaryQuery) {
    'use strict';
    var components, decodedUri, methodName = 'QueryContext';
    logger.info(methodName, 'configuration: ' + configuration);
    logger.info(methodName, 'resultsHandler: ' + resultsHandler);
    logger.info(methodName, 'request: ' + request);
    logger.info(methodName, 'response: ' + response);
    logger.info(methodName, 'resourceId: ' + resourceId);
    logger.info(methodName, 'userId: ' + userId);
    logger.info(methodName, 'isMetadataQuery: ' + isMetadataQuery);
    logger.info(methodName, 'isSummaryQuery: ' + isSummaryQuery);
    assertTrue(database, 'A database is required.');
    assertTrue(request, 'A web request is required.');
    assertTrue(response, 'A web client response is required.');
    assertTrue(resultsHandler, 'A results handler is required.');
    if (resourceId) {
        decodedUri = decodeURI(resourceId);
        if (!resource.isValidResourceId(decodedUri)) {
            throw new Error('The resource ID "' + resourceId + '" is invalid. It contains characters that are not allowed within resource identifiers.');
        }
    } else {
        throw new Error('A resource ID is required.');
    }
    assertTrue(userId, 'A user ID is required.');
    if (request.url === null) {
        throw new Error('The web request must have a URL');
    }
    components = request.url.split('/');
    this.applicationName = (components.length > 0) ? components[1] : '';
    this.configuration = configuration;
    this.database = database;
    this.externalizeReferences = true;
    this.fileReadRequests = { };
    this.isMetadataQuery = isMetadataQuery;
    this.isSummaryQuery = isSummaryQuery;
    if (request.url) {
        this.queryParameters = url.parse(request.url, true).query;
    }
    this.request = request;
    this.response = response;
    this.resourceId = resourceId;
    this.result = null;
    this.resultsHandler = resultsHandler;
    this.user = null;
    this.userId = userId;
    this.createHref = function createHref() {
        return encodeURI(this.configuration.baseUrl + '/' + this.configuration.applicationName + '/' + this.database.name + this.resourceId);
    };
    // TODO - The database needs to populate this with the names of each of the thing's ancestors.
    this.path = this.resourceId;
}

/**
 * Returns a new, initialized context for a database query.
 *
 * @param {ApplicationConfiguration} configuration  Required application configuration settings.
 * @param {QueryResultsHandler} resultsHandler      Required handler notified when a database returns query results.
 * @param request                                   Required web request.
 * @param response                                  Required response to web client.
 * @param {Database} database                       Required database of persistent things.
 * @param {string} resourceId                       Required unique resource identifier of a persistent thing to query.
 * @param {string} userId                           Required unique resource identifier of the user performing a database query.
 * @param {boolean} isMetadataQuery                 Is the user querying type information (metadata: data about data)?
 * @param {boolean} isSummaryQuery                  Is the user requesting summarized results?
 */
function newInstance(configuration, resultsHandler, request, response, database, resourceId, userId, isMetadataQuery, isSummaryQuery) {
    'use strict';
    return new QueryContext(configuration, resultsHandler, request, response, database, resourceId, userId, isMetadataQuery, isSummaryQuery);
}

exports.newInstance = newInstance;
