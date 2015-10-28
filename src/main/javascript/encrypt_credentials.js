/*globals process, require*/

var crypto = require('crypto'),

    fs = require('fs'),

    logger = require('./logger').newInstance('EncryptCredentials');

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
    var c,
        encoded = '',
        encodedChars = new Array(4),
        plainChars = new Array(3),
        i,
        input = plainText.replace(/\r\n/g, '\n'),
        j,
        utfText = '';
    for (i = 0; i < input.length; i += 1) {
        c = input.charCodeAt(i);
        if (c < 128) {
            utfText += String.fromCharCode(c);
        } else if ((c > 127) && (c < 2048)) {
            /*jshint bitwise: true */
            /*jslint bitwise: true */
            utfText += String.fromCharCode((c >> 6) | 192);
            utfText += String.fromCharCode((c & 63) | 128);
        } else {
            utfText += String.fromCharCode((c >> 12) | 224);
            utfText += String.fromCharCode(((c >> 6) & 63) | 128);
            utfText += String.fromCharCode((c & 63) | 128);
            /*jshint bitwise: true */
            /*jslint bitwise: false */
        }
    }
    i = 0;
    while (i < utfText.length) {
        plainChars[0] = utfText.charCodeAt(i);
        i += 1;
        plainChars[1] = utfText.charCodeAt(i);
        i += 1;
        plainChars[2] = utfText.charCodeAt(i);
        i += 1;
        /*jslint bitwise:true */
        encodedChars[0] = plainChars[0] >> 2;
        encodedChars[1] = ((plainChars[0] & 3) << 4) | (plainChars[1] >> 4);
        encodedChars[2] = ((plainChars[1] & 15) << 2) | (plainChars[2] >> 6);
        encodedChars[3] = plainChars[2] & 63;
        /*jslint bitwise:false */

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

if (process.argv.length > 1) {
    crypto.randomBytes(64, function (error, buffer) {
        'use strict';
        if (error) {
            throw error;
        }
        var passwordSalt = buffer.toString('base64'), /// (encodeAsBase64(buffer.toString()),
            password = process.argv[2];
        logger.info('', 'passwordSalt=' + passwordSalt + '"');
        crypto.pbkdf2(password, passwordSalt, 500, 120,
            function (error, encryptedPassword) {
                logger.debug('', 'error: ' + error);
                logger.debug('', 'password ="' + encryptedPassword.toString('base64') + '"'); /// encodeAsBase64(encryptedPassword) + '"');
            });
    });
} else {
    logger.error('', 'Usage: node encrypt_credentials.js <password>');
    logger.error('', '          Where <password> is the user\'s password.');
}