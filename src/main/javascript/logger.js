/*globals exports, require, warn*/

/**
 * An application's shared logger that logs different types of messages to log destinations.
 */

/** Import Winston logging package */
// TODO - Using a modified Winston package. Use the standard and make sure the standard version is deployed
// in all environments, and that we are notified about new versions.
var winston = require('../../../node_modules/winston'),

    defaultLogger = new (winston.Logger)({
        transports: [new winston.transports.Console({ level: 'info' })]
    });

/**
 * Logs a debug-level message.
 *
 * @param {string} className    Optional name of class (type of object) logging a debug message.
 * @param {string} methodName   Optional name of the method logging a debug message.
 * @param {Object} message      Optional debug message to log.
 */
function debug(className, methodName, message) {
    'use strict';
    defaultLogger.debug(className + ((methodName === null) ? '' : '.' + methodName) + ': ' + message);
}

/**
 * Logs an error message.
 *
 * @param {string} className    Optional name of class (type of object) logging an error message.
 * @param {string} methodName   Optional name of the method logging a debug message.
 * @param {Object} message      Optional error message to log.
 */
function error(className, methodName, message) {
    'use strict';
    defaultLogger.error(className + ((methodName === null) ? '' : '.' + methodName) + ': ' + message);
}

/**
 * Logs an information-level message.
 *
 * @param {string} className    Optional name of class (type of object) logging an information message.
 * @param {string} methodName   Optional name of the method logging an information message.
 * @param {Object} message      Optional information message to log.
 */
function info(className, methodName, message) {
    'use strict';
    defaultLogger.info(className + ((methodName === null) ? '' : '.' + methodName) + ': ' + message);
}

/**
 * Returns a shared logger configured for use within an application.
 *
 * @param {string} className    Optional name of class that this logger logs messages for.
 * @return {Logger} A non-null logger.
 * @constructor
 */
function Logger(className) {
    'use strict';
    var logger = this;
    this.className = className;
    this.debug = function (methodName, message) {
        debug(logger.className, methodName, message);
    };
    this.error = function (methodName, message) {
        error(logger.className, methodName, message);
    };
    this.info = function (methodName, message) {
        info(logger.className, methodName, message);
    };
    this.warn = function (methodName, message) {
        warn(logger.className, methodName, message);
    };
    this.logger = defaultLogger;
    return this;
}

/**
 * Creates, and returns, a new logger.
 *
 * @param {string} className    Optional name of class that this logger logs messages for.
 * @return {Logger} A new logger.
 */
function newInstance(className) {
    'use strict';
    return new Logger(className);
}

/**
 * Logs a warning-level message.
 *
 * @param {string} className    Optional name of class (type of object) logging a warning message.
 * @param {string} methodName   Optional name of the method logging a warning message.
 * @param {Object} message      Optional warning message to log.
 */
function warn(className, methodName, message) {
    'use strict';
    defaultLogger.warn(className + ((methodName === null) ? '' : '.' + methodName) + ': ' + message);
}

exports.newInstance = newInstance;