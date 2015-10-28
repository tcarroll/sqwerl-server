/*globals Buffer, console, process, require*/

/**
 * Decrypts a file.
 */
var cryptography = require('crypto'),

    fs = require('fs'),

    logger = require('./logger').newInstance('Encrypt'),

    readLine = require('readline');

if (process.argv.length > 2) {
    var encryptedFileName = process.argv[2],
        input = readLine.createInterface({
            input: process.stdin,
            output: process.stdout
        }),
        plaintextFileName,
        encryptedSuffixLocation = encryptedFileName.indexOf('.encrypted');
    if (encryptedSuffixLocation > 0) {
        plaintextFileName = encryptedFileName.substring(0, encryptedSuffixLocation);
        logger.info('', 'encryptedFileName: "' + encryptedFileName + '"');
        input.question('Enter password: ', function (password) {
            'use strict';
            input.close();
            decrypt(encryptedFileName, plaintextFileName, password, function () {
                console.log('Finished decrypting file "' + encryptedFileName + '" to "' + plaintextFileName + '".');
            });
        });
    } else {
        logger.error('', 'The encrypted file name must end with the extension ".encrypted".');
    }
} else {
    logger.error('Decrypt', 'Usage: node decrypt_file <encrypted_file>');
    logger.error('Decrypt', '       Where <encrypted_file> is the file to decrypt.');
}

function decrypt(encryptedFileName, plaintextFileName, password, callback) {
    'use strict';
    var decipher,
        inputStream = fs.createReadStream(encryptedFileName),
        outputStream = fs.createWriteStream(plaintextFileName);
    decipher = cryptography.createDecipher('aes-128-cbc', password);
    inputStream.on('data', function (data) {
        outputStream.write(new Buffer(decipher.update(data), 'binary'));
    });
    inputStream.on('end', function () {
        outputStream.write(new Buffer(decipher.final('binary'), 'binary'));
        outputStream.end();
        outputStream.on('close', function () {
            callback();
        });
    });
}