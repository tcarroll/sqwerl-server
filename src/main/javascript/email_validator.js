/*globals exports, require*/

/**
 * Validates that strings are formatted as proper e-mail addresses.
 */
var atom = '[^\\s\\(\\)><@,;:\\\\\\"\\.\\[\\]]+',

    domainPattern = new RegExp('^[^\\s\\(\\)><@,;:\\\\\\\"\\.\\[\\]].(\\.[^\\s\\(\\)><@,;:\\\\\\\"\\.\\[\\]].)*$'),

// TODO - See http://stackoverflow.com/questions/2049502/what-characters-are-allowed-in-email-address
//  Characters allowed in name: abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!#$%&'*+-/=?^_`{|}~.
//  Characters allowed in server: abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-.
    emailPattern = /^(.+)@(.+)$/,

    ipPattern = /^\[(\d{1,3})\.(\d{1,3})\.(\d{1,3})\]$/,

    logger = require('./logger').newInstance('EmailValidator'),

    userPattern = new RegExp('^([^\\s\\(\\)><@,;:\\\\\\\"\\.\\[\\]]+|(\"[^\"]*\"))(\\.([^\\s\\(\\)><@,;:\\\\\\\"\\.\\[\\]]+|(\"[^\"]*\")))*$');

/**
 * Is the domain portion of an e-mail address valid?
 *
 * @param {String} domain   Required part of an e-mail address that specifies the user's domain.
 * @return {Boolean} true if the given domain specifier is valid.
 */
function checkDomains(domain) {
    'use strict';
    var isValid = true,
        pattern = new RegExp('^' + atom + '$'),
        domainArray = domain.split('.'),
        count = domainArray.length,
        i,
        methodName = 'checkDomains';
    for (i = 0; i < count; i += 1) {
        if (domainArray[i].search(pattern) === -1) {
            isValid = false;
            break;
        }
    }
    logger.debug(methodName, 'domain "' + domain + '" ' + (isValid ? 'is valid.' : 'is invalid.'));
    return isValid;
}

/**
 * Is the IP address portion of an e-mail address valid?
 *
 * @param {String} ip   Required internet dotted numeric address.
 * @return {Boolean}    true if the given ip specifier is valid.
 */
function checkIp(ip) {
    'use strict';
    var isInvalidAddress = false,
        i,
        methodName = 'checkIp';
    for (i = 0; i < 4; i += 1) {
        if (ip[i] > 255) {
            isInvalidAddress = true;
            break;
        }
    }
    logger.debug(methodName, 'IP "' + ip + '" ' + (isInvalidAddress ? 'is invalid.' : 'is valid.'));
    return isInvalidAddress;
}

/**
 * Does the given string contain characters not allowed within an e-mail address?
 *
 * @param {String} s    Required string that is part of an e-mail address.
 * @return {Boolean}    true if the given string contains characters that are not allowed in an e-mail address.
 */
function containsInvalidCharacters(s) {
    'use strict';
    var hasInvalidCharacters = false,
        i,
        methodName = 'containsInvalidCharacters',
        size = s.length;
    for (i = 0; i < size; i += 1) {
        if (s.charCodeAt(i) > 127) {
            hasInvalidCharacters = true;
            break;
        }
    }
    logger.debug(methodName, 'The string "' + s + '" ' + (hasInvalidCharacters ? 'has invalid characters' : 'doesn\'t contain invalid characters.'));
    return hasInvalidCharacters;
}

/**
 * Validates that a given e-mail address is valid according to the rules for specifying e-mail addresses.
 *
 * @param {String} address  Require e-mail address.
 * @return {Boolean}        false if the string cannot be a valid e-mail address.
 */
function validate(address) {
    'use strict';
    var domain,
        ip,
        isValid = false,
        matchArray,
        methodName = 'validate',
        user;
    if (address) {
        matchArray = address.match(emailPattern);
        if (matchArray) {
            user = matchArray[1];
            domain = matchArray[2];
            if (user &&
                    domain &&
                    (!containsInvalidCharacters(user)) &&
                    (!containsInvalidCharacters(domain) &&
                    user.match(userPattern))) {
                ip = domain.match(ipPattern);
                isValid = ip ? checkIp(ip) : checkDomains(domain);
            }
        }
    }
    logger.debug(methodName, 'The address "' + address + '" ' + (isValid ? 'is valid.' : 'is not valid.'));
    return isValid;
}

exports.validate = validate;