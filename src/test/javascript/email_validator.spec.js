/*globals describe, expect, it, require*/

var email_validator = require('../../main/javascript/email_validator');

var validEmailAddress = 'joe.blow@foobar.com';

describe('email_validator', function () {
    'use strict';
    it('Validates valid email address', function () {
        expect(email_validator.validate(validEmailAddress)).toBe(true);
    });
    it('Invalidates email address that contains invalid characters', function () {
        expect(email_validator.validate('\u00A9')).toBe(false);
    });
    it('Invalidates empty email address', function () {
        expect(email_validator.validate('')).toBe(false);
    });
    it('Invalidates email addresses that begin with periods.', function () {
        expect(email_validator.validate('.joe.blow@foobar.com')).toBe(false);
    });
    it('Invalidates email addresses that end with periods', function () {
        expect(email_validator.validate('joe.blow.@foobar.com')).toBe(false);
    });
    it('Invalidates email addresses that contain two consecutive periods', function () {
        expect(email_validator.validate('joe..blow@foobar.com')).toBe(false);
    });
});