/*globals exports, require*/

/**
 * @class QueryResultsHandler
 *
 * Contains callback functions that a database invokes when it has finished processing a query.
 */

/**
 * This class' logger.
 * @type {Logger}
 */
var logger = require('./logger').newInstance('QueryResultsHandler');

/**
 * Returns a default query results handler that does nothing except log when its callbacks are invoked.
 *
 * @param {function} [resourceNotFoundCallback]   Optional function invoked when a queried resource doesn't exist.
 * @param {function} [returnFileCallback]         Optional function invoked to return the contents of a file.
 * @param {function} [returnObjectCallback]       Optional function invoked to return a resource.
 * @param {function} [userCannotReadCallback]     Optional function invoked when a user doesn't have permission to read a resource.
 * @constructor
 */
function QueryResultsHandler(resourceNotFoundCallback, returnFileCallback, returnObjectCallback, userCannotReadCallback) {
    'use strict';
    if (resourceNotFoundCallback) {
        this.resourceNotFound = resourceNotFoundCallback;
    } else {
        this.resourceNotFound = function (context, error) {
            logger.debug('resourceNotFound', 'context = ' + context);
            if (error) {
                logger.debug('Error: ' + error);
            }
        };
    }

    if (returnFileCallback) {
        this.returnFile = returnFileCallback;
    } else {
        this.returnFile = function (context, qualifiedFileName) {
            logger.debug('returnFile', 'qualifiedName = "' + qualifiedFileName + '", context = "' + context + '"');
        };
    }

    if (returnObjectCallback) {
        this.returnObject = returnObjectCallback;
    } else {
        this.returnObject = function (context) {
            logger.debug('returnObject', 'context = ' + context);
        };
    }

    if (userCannotReadCallback) {
        this.userCannotRead = userCannotReadCallback;
    } else {
        this.userCannotRead = function (context) {
            logger.debug('userCannotRead', 'context = ' + context);
        };
    }
}

/**
 * Creates, and returns, a new query results handler that doesn't do anything except log when its callbacks are invoked.
 *
 * @param {function} [resourceNotFoundCallback]   Optional function invoked when a queried resource doesn't exist.
 * @param {function} [returnFileCallback]         Optional function invoked to return the contents of a file.
 * @param {function} [returnObjectCallback]       Optional function invoked to return a resource.
 * @param {function} [userCannotReadCallback]     Optional function invoked when a user doesn't have permission to read a resource.
 * @return {QueryResultsHandler}
 */
function newInstance(resourceNotFoundCallback, returnFileCallback, returnObjectCallback, userCannotReadCallback) {
    'use strict';
    return new QueryResultsHandler(resourceNotFoundCallback, returnFileCallback, returnObjectCallback, userCannotReadCallback);
}

exports.newInstance = newInstance;