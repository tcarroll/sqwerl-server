/*globals convertValue, exports, require*/

/**
 * Converts information into different formats.
 */

/**
 * This class' logger.
 * @type {Logger}
 */
var logger = require('./logger').newInstance('Converter'),
    valueConverter = require('./value_converter');

/**
 * Returns a JSON (JavaScript Object Notation) string that
 * corresponds to the given object with the given unique identifier.
 *
 * @param {*} object                Required resource object.
 */
function asJson(object) {
    'use strict';
    var json,
        methodName = 'asJson';
    json = JSON.stringify(object);
    logger.info(methodName, 'object = ' + json);
    return json;
}

/**
 * Returns an object equivalent to the given data.
 *
 * @param {Database} database   Required database database that contains the data.
 * @param {String} resourceId   Required unique identifier for the persistent thing that given the data represents.
 * @param data                  Required data that defines a persistent thing.
 * @param {Object} [user]       Optional user requesting to retrieve object.
 * @param {String} [userId]     Optional unique identifier of the user requesting to retrieve object.
 * @return {*} An object that corresponds to the given data.
 */
function asObject(database, resourceId, data, user, userId) {
    'use strict';
    var methodName = 'asObject',
        representations,
        result;
    if (!database) {
        throw new Error('A non-null database is required.');
    }
    if (!database.applicationName) {
        throw new Error('The database must have a non-null, non-empty application name.');
    }
    if (!database.name) {
        throw new Error('The database must have a non-null, non-empty name.');
    }
    try {
        result = JSON.parse(data);
        Object.keys(result).forEach(function (property) {
            if (user && (property === 'readBy')) {
                result.userHasRead = result[property].hasOwnProperty('<' + user.id + '>');
            }
            if (property === 'representations') {
                representations = result.representations;
                Object.keys(representations).forEach(function (representation) {
                    if (user && userId && (!database.canRead(database, resourceId + '/' + representation, user, userId))) {
                        delete result.representations[representation];
                    }
                });
            } else {
                result[property] = convertValue(database, null, resourceId, result[property]);
            }
        });
    } catch (error) {
        throw new Error('Syntax error detected in database "' + database.name + '", resource ID "' + resourceId + '",\ndata: "' + data + '"\nError: ' + error);
    }
    logger.debug(methodName, result);
    return result;
}

/**
 * Returns an equivalent object property value.
 *
 * @param {Database} database   Required database that contains the given data.
 * @param [context]             Optional default value to return.
 * @param {String} resourceId   A resource's unique identifier.
 * @param value                 A value to convert.
 * @return {*} An equivalent value.
 */
function convertValue(database, context, resourceId, value) {
    'use strict';
    var result = context;
    if (typeof value === 'string') {
        result = valueConverter.convertString(database, resourceId, value);
    } else {
        if (typeof value === 'boolean') {
            result = valueConverter.convertBoolean(value);
        } else if (value instanceof Array) {
            result = valueConverter.convertArray(convertValue, database, context, resourceId, value);
        } else if (value instanceof Object) {
            result = valueConverter.convertObject(convertValue, database, context, resourceId, value);
        }
    }
    return result;
}

function stripApplicationAndDatabase(resourceId) {
    'use strict';
    return '</' + resourceId.split('/').slice(3).join('/');
}

/**
 * Returns the path part of a resource reference.
 *
 * @param {String} resourceId   Required reference to a resource.
 * @return {String} The path part of the given resource reference.
 */
function stripReferenceMarks(resourceId) {
    'use strict';
    var endIndex = resourceId.length,
        i,
        startIndex = 0,
        trimmed = resourceId.trim();
    if (trimmed.charAt(0) === '<') {
        startIndex = 1;
    }
    i = resourceId.lastIndexOf('>');
    if (i > -1) {
        endIndex = i;
    }
    return resourceId.slice(startIndex, endIndex);
}

exports.asJson = asJson;
exports.asObject = asObject;
exports.stripApplicationAndDatabase = stripApplicationAndDatabase;
exports.stripReferenceMarks = stripReferenceMarks;