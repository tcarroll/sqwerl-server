/*globals Buffer, describe, expect, it, require*/

var security = require('../../main/javascript/security');

describe('security', function () {
    'use strict';
    it('Can encode base 64', function () {
        var plainText = 'A man a plan a canal Panama',
            encodedText = new Buffer(plainText, 'utf8').toString('base64');
        expect(encodedText).toBe('QSBtYW4gYSBwbGFuIGEgY2FuYWwgUGFuYW1h');
    });
});


