/*globals exports, require*/

/**
 * Authenticates users.
 */
var crypto = require('crypto'),

    router = require('./router'),

/**
 * The guest account's unique identifier.
 * @type {String}
 */
    guestUserName = 'guest@sqwerl.org';

/**
 * Authenticates a user's ability to interact with a Sqwerl server.
 *
 * @param router                Required web service request router (handler).
 * @param {String} userName     Required user name.
 * @param {String} password     Required user password.
 * @param catalog               Required catalog database that contains user accounts.
 * @param onSuccess             Required callback function invoked if the user with the given name and password is allowed to interact with a Sqwerl server.
 * @param onFailure             Required callback function invoked if the user with the given name and password is not allowed to interact with a Sqwerl server.
 */
function authenticate(router, userName, password, catalog, onSuccess, onFailure) {
    'use strict';
    if (!router) {
        throw new Error('Router is required.');
    }
    if (!userName) {
        throw new Error('User name is required.');
    }
    if (!password) {
        throw new Error('Missing password.');
    }
    if (!catalog) {
        throw new Error('Catalog database required.');
    }
    if (!onSuccess) {
        throw new Error('Authentication successful callback required.');
    }
    if (!onFailure) {
        throw new Error('Authentication failure callback required.');
    }
    catalog.fetchAccount(catalog, router, password, onAccountFetched, onSuccess, onFailure);
}

/**
 * Returns text that is the base 64 encoding of the given text.
 *
 * @param plainText     Required text.
 */
function encodeAsBase64(plainText) {
    'use strict';
    if (!plainText) {
        throw new Error('Non-null, non-empty input required.');
    }
    var encoded = '',
        encodedChars = new Array(4),
        plainChars = new Array(3),
        input = plainText.replace(/\r\n/g, '\n'),
        utfText = '',
        i,
        j,
        c;
    for (i = 0; i < input.length; i += 1) {
        c = input.charCodeAt(i);
        /*jshint bitwise: true */
        /*jslint bitwise: true */
        if (c < 128) {
            utfText += String.fromCharCode(c);
        } else if ((c > 127) && (c < 2048)) {
            utfText += String.fromCharCode((c >> 6) | 192);
            utfText += String.fromCharCode((c & 63) | 128);
        } else {
            utfText += String.fromCharCode((c >> 12) | 224);
            utfText += String.fromCharCode(((c >> 6) & 63) | 128);
            utfText += String.fromCharCode((c & 63) | 128);
        }
        /*jshint bitwise: false */
        /*jslint bitwise: false */
    }
    i = 0;
    while (i < utfText.length) {
        plainChars[0] = utfText.charCodeAt(i);
        plainChars[1] = utfText.charCodeAt(i);
        i += 1;
        plainChars[2] = utfText.charCodeAt(i);
        i += 2;
        /*jshint bitwise: true */
        /*jslint bitwise: true */
        encodedChars[0] = plainChars[0] >> 2;
        encodedChars[1] = ((plainChars[0] & 3) << 4) | (plainChars[1] >> 4);
        encodedChars[2] = ((plainChars[1] & 15) << 2) | (plainChars[2] >> 6);
        encodedChars[3] = plainChars[2] & 63;
        /*jshint bitwise: false */
        /*jslint bitwise: false */

        if (isNaN(plainChars[1])) {
            encodedChars[2] = encodedChars[3] = 64;
        } else if (isNaN(encodedChars[2])) {
            encodedChars[3] = 64;
        }
        for (j = 0; j < 4; j += 1) {
            encoded += 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='.charAt(encodedChars[j]);
        }
    }
    return encoded;
}

/**
 * Invoked when a response to retrieve a user's account has been received.
 *
 * @param account           User's account or null.
 * @param {String} password Required user password.
 * @param onSuccess         Required callback function invoked if the user with the given name and password is allowed to interact with a Sqwerl server.
 * @param onFailure         Required callback function invoked if the user with the given name and password is not allowed to interact with a Sqwerl server.
 */
function onAccountFetched(account, password, onSuccess, onFailure) {
    'use strict';
    var authenticatedUser,
        handle;
    if (account && account.isEnabled && (!account.isLocked)) {
        handle = account.handle;
        if (!handle) {
            handle = account.user.split('/').pop();
        }
        authenticatedUser = { alias: handle, id: '/' + account.user.split('/').slice(3).join('/') };
        if (account.user && (account.user.split('/').pop() === 'guest')) {
            onSuccess(authenticatedUser);
        } else {
            if (account.salt) {
                crypto.pbkdf2(password, account.salt, 500, 120,
                    function (error, encryptedPassword) {
                        if (account.password === encryptedPassword.toString('base64')) { //encodeAsBase64(encryptedPassword)) {
                            onSuccess(authenticatedUser);
                        } else {
                            onFailure();
                        }
                    });
            } else {
                onFailure();
            }
        }
    }
}

exports.authenticate = authenticate;
//exports.encodeAsBase64 = encodeAsBase64;
exports.guestUserName = guestUserName;

