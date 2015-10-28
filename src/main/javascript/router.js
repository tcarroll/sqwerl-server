/*global exports, require, route*/

/**
 * Routes HTTP requests for processing.
 */

/**
 * The name of the catalog database that contains information about other databases
 * @type {String}
 */
var catalogDatabaseName,

    /**
     * Path to the Javascript code for the web client user interface.
     * @type {String}
     */
    clientSourcePath = null,

    database = require('./database'),

    /**
     * Databases to route queries to.
     * @type {Object}
     */
    databases = null,

    fs = require('fs'),

    logger = require('./logger').newInstance('Router'),

    /**
     * The name of a resource that is metadata (information about data) for a type of thing.
     * @type {string}
     */
    metadataResourceName = 'schema',

    /**
     * Default network port this router's host server listens to for requests.
     * This can be overridden in a configuration file.
     * @type {number}
     */
    port = 8080,

    queryContext = require('./query_context'),

    /**
     * The name of a resource that is a summary of information about a thing.
     * @type {string}
     */
    summaryResourceName = 'summary';

/**
 * Constructs a web application request router.
 *
 * @param {Object} configuration        This router's configuration.
 * @constructor Constructs web application router that accepts web requests and routes them for processing.
 */
function Router(configuration) {
    'use strict';
    var catalogDatabase = database.newInstance(configuration.applicationName, configuration.catalogDatabaseName, null, configuration.catalogDatabasePath),
        methodName = 'Router',
        publicDatabase = database.newInstance(configuration.applicationName, configuration.defaultDatabaseName, catalogDatabase, configuration.defaultDatabasePath);
    this.baseUrl = configuration.baseUrl;
    this.catalogDatabase = catalogDatabase;
    this.catalogDatabaseName = configuration.catalogDatabaseName;
    this.clientSourcePath = configuration.clientSourcePath;
    this.configuration = configuration;
    this.databases = {};
    this.databases[configuration.catalogDatabaseName] = catalogDatabase;
    this.databases[configuration.defaultDatabaseName] = publicDatabase;
    this.port = configuration.port;
    this.route = route;
    logger.info(methodName, 'Created a router.');
}

/**
 * Handles an HTTP request.
 *
 * @param {QueryResultsHandler} resultsHandler  Required object that handles when a database returns query results.
 * @param {Router} router                       This router (must not be null).
 * @param {String} [pathName]                   Optional path to a resource.
 * @param request                               Non-null client request.
 * @param response                              A non-null response to send back to client.
 */
function route(resultsHandler, router, pathName, request, response) {
    'use strict';
    var components = pathName ? pathName.split('/') : null,
        context,
        count = components ? components.length : 0,
        database,
        databaseName = '',
        isMetadataQuery,
        isSummaryQuery,
        lastComponent,
        methodName = 'route',
        resourceId;
    logger.info(methodName, 'Routing request for "' + pathName + '" for the user named "' + request.session.data.user.id + '".');
    if (count > 1) {
        if ((count > 2) && (components[1] !== 'search')) {
            databaseName = components[2];
            logger.info(methodName, 'accept: ' + request.headers.accept);
            logger.info(methodName, 'databaseName: ' + databaseName);
            logger.info(methodName, 'databases: ' + router.databases);
            database = router.databases[databaseName];
            if (database) {
                logger.info(methodName, 'database: ' + database.name);
                lastComponent = components[components.length - 1];
                isMetadataQuery = (lastComponent === metadataResourceName);
                isSummaryQuery = (lastComponent === summaryResourceName);
                resourceId = '/' + components.slice(3, components.length - ((isMetadataQuery || isSummaryQuery) ? 1 : 0)).join('/');
                resourceId = resourceId.replace(/-/g, '%20');
                logger.info(methodName, 'Resource ID: "' + resourceId + '".');
                try {
                    context = queryContext.newInstance(router.configuration, resultsHandler, request, response, database, decodeURI(resourceId), request.session.data.user.id, isMetadataQuery, isSummaryQuery);
                    database.query(context);
                } catch (error) {
                    logger.error(methodName, 'Query execution failed: ' + error.message);
                    response.writeHead(400, {'Content-Type': 'text/plain'});
                    response.write(error.message);
                    response.end();
                }
            } else {
                logger.info(methodName, 'No database named "' + databaseName + '".');
                response.writeHead(404, {'Content-Type': 'text/plain'});
                if (databaseName.length === 0) {
                    response.write('Missing database name.');
                } else {
                    response.write('There is no database named "' + databaseName + '".');
                }
                response.end();
            }
        }
    } else {
        logger.info(methodName, 'Missing application name.');
        response.writeHead(404, { 'Content-Type': 'text/plain' });
        response.write('Missing application name.');
        response.end();
    }
}

exports.clientSourcePath = clientSourcePath;
exports.route = route;
exports.Router = Router;