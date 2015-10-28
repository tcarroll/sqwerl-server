/*globals exports, require*/

/**
 * Checks if a resource ID contains invalid characters.
 */

var logger = require('./logger').newInstance('Resource');

/**
 * Is a given resource ID valid?
 *
 * @param {String} [resourceId]   A persistent object's unique identifier or null.
 * @return {Boolean} false if the given resource identifier contains illegal characters.
 */
function isValidResourceId(resourceId) {
    'use strict';
    var c,
        i,
        idLength,
        isValid = true,
        methodName = 'isValidResourceId';
    logger.debug(methodName, 'Checking validity of resource ID "' + resourceId + '"');
    if (resourceId) {
        idLength = resourceId.length;
        for (i = 0; isValid && (i < idLength); i += 1) {
            c = resourceId[i];
            switch (c) {
            case '.':
                if ((i < idLength - 1) && (resourceId[i + 1] === '.')) {
                    isValid = false;
                }
                break;

            case '$':
            case '~':
            case '#':
            case ':':
            case ';':
            case '\\':
            case '%':
            case '|':
            case '{':
            case '}':
            case '`':
            case '\'':
            case '"':
            case '+':
            case '!':
            case '@':
            case '^':
            case '&':
            case '*':
            case '=':
            case '[':
            case ']':
            case ',':
            case '?':
            case '<':
            case '>':
            case '-':
                isValid = false;
                break;
            }
        }
    } else {
        isValid = false;
    }
    logger.debug(methodName, 'The resource "' + resourceId + '" ' + (isValid ? 'is' : 'isn\'t') + ' valid');
    return isValid;
}

exports.isValidResourceId = isValidResourceId;