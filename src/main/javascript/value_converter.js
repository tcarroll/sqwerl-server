/*global exports, require*/

var logger = require('./logger').newInstance('ValueConverter');

function convertArray(converter, database, context, resourcesId, values) {
    'use strict';
    var a = [],
        methodName = 'convertArray';
    values.forEach(function (value) {
        a.push(converter(database, context, resourcesId, value));
    });
    logger.debug(methodName, 'Converted array value.');
    return a;
}

function convertBoolean(flag) {
    'use strict';
    var methodName = 'convertBoolean',
        result = flag;
    logger.debug(methodName, 'boolean value "' + flag + '" converted to "' + result + '"');
    return result;
}

function convertObject(converter, database, context, resourcesId, value) {
    'use strict';
    var methodName = 'convertObject',
        object = {},
        propertyName;
    logger.debug(methodName, 'Converting object value...');
    Object.keys(value).forEach(function (property) {
        propertyName = converter(database, context, resourcesId, property);
        object[propertyName] = value[property];
        logger.debug(methodName, 'property: "' + propertyName + '" = "' + value[property] + '"');
    });
    return object;
}

function convertString(database, resourceId, value) {
    'use strict';
    var buffer,
        methodName = 'convertString',
        result;
    if (value && (value.length > 0)) {
        value = value.trim();
        if (value.charAt(0) === '<') {
            buffer = '</' + database.applicationName + '/' + database.name;
            if (value.charAt(1) === '/') {
                // Absolute path.
                buffer += encodeURI(value.substring(1, value.length - 1));
            } else {
                // Relative path.
                buffer += encodeURI(resourceId + '/' + value.substring(1, value.length - 1));
            }
            buffer += '>';
            result = buffer;
        } else {
            result = value;
        }
    } else {
        result = value;
    }
    logger.debug(methodName, 'string value "' + value + '", converted to "' + result + '"');
    return result;
}

exports.convertArray = convertArray;
exports.convertBoolean = convertBoolean;
exports.convertObject = convertObject;
exports.convertString = convertString;