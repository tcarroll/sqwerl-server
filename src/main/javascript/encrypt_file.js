/*globals Buffer, console, encrypt, process, require*/

/**
 * Encrypts a file.
 */
var cryptography = require('crypto'),

    fs = require('fs'),

    logger = require('./logger').newInstance('Encrypt'),

    readLine = require('readline');

if (process.argv.length > 2) {
    var plaintextFileName = process.argv[2],
        input = readLine.createInterface({
            input: process.stdin,
            output: process.stdout
        }),
        encryptedFileName = plaintextFileName + '.encrypted';
    input.question('Enter password for encrypting or decrypting file: ', function (password) {
        'use strict';
        input.close();
        encrypt(plaintextFileName, encryptedFileName, password, function () {
            console.log('Finished encrypting file "' + plaintextFileName + '" as "' + encryptedFileName + '".');
        });
    });
} else {
    logger.error('Encrypt', 'Usage: node encrypt_file <input_file>');
    logger.error('Encrypt', '       Where <input_file> is the file to encrypt.');
}

function encrypt(plaintextFileName, encryptedFileName, password, callback) {
    'use strict';
    var cipher,
        inputStream = fs.createReadStream(plaintextFileName),
        outputStream = fs.createWriteStream(encryptedFileName);
    cipher = cryptography.createCipher('aes-128-cbc', password);
    inputStream.on('data', function (data) {
        outputStream.write(new Buffer(cipher.update(data), 'binary'));
    });
    inputStream.on('end', function () {
        outputStream.write(new Buffer(cipher.final('binary'), 'binary'));
        outputStream.end();
        outputStream.on('close', function () {
            callback();
        });
    });
}