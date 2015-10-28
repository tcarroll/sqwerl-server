/*globals describe, expect, it, require*/

var resource = require('../../main/javascript/resource');

describe('resource', function () {
    'use strict';
    it('Empty resource id is invalid', function () {
        expect(resource.isValidResourceId('')).toBe(false);
    });
    it('Valid resource id', function () {
        expect(resource.isValidResourceId('types')).toBe(true);
    });
    it('Resource ids cannot contain dollar signs', function () {
        expect(resource.isValidResourceId('$')).toBe(false);
    });
    it('Resource ids cannot contain tildes', function () {
        expect(resource.isValidResourceId('~')).toBe(false);
    });
    it('Resource ids cannot contain hash marks', function () {
        expect(resource.isValidResourceId('#')).toBe(false);
    });
    it('Resource ids cannot contain colons', function () {
        expect(resource.isValidResourceId(':')).toBe(false);
    });
    it('Resource ids cannot contain semi-colons', function () {
        expect(resource.isValidResourceId(';')).toBe(false);
    });
    it('Resource ids cannot contain backslashes', function () {
        expect(resource.isValidResourceId('\\')).toBe(false);
    });
    it('Resource ids cannot contain percent signs', function () {
        expect(resource.isValidResourceId('%')).toBe(false);
    });
    it('Resource ids cannot contain pipe symbols', function () {
        expect(resource.isValidResourceId('|')).toBe(false);
    });
    it('Resource ids cannot contain left curly brackets', function () {
        expect(resource.isValidResourceId('{')).toBe(false);
    });
    it('Resource ids cannot contain right curly braces', function () {
        expect(resource.isValidResourceId('}')).toBe(false);
    });
    it('Resource ids cannot contain grave accents', function () {
        expect(resource.isValidResourceId('`')).toBe(false);
    });
    it('Resource ids cannot contain single quotes', function () {
        expect(resource.isValidResourceId('\'')).toBe(false);
    });
    it('Resource ids cannot contain double quotes', function () {
        expect(resource.isValidResourceId('\"')).toBe(false);
    });
    it('Resource ids cannot contain plus signs', function () {
        expect(resource.isValidResourceId('+')).toBe(false);
    });
    it('Resource ids cannot contain exclamation points', function () {
        expect(resource.isValidResourceId('!')).toBe(false);
    });
    it('Resource ids cannot contain commercial at symbols', function () {
        expect(resource.isValidResourceId('@')).toBe(false);
    });
    it('Resource ids cannot contain circumflexes', function () {
        expect(resource.isValidResourceId('^')).toBe(false);
    });
    it('Resource ids cannot contain ampersands', function () {
        expect(resource.isValidResourceId('&')).toBe(false);
    });
    it('Resource ids cannot contain asterisks', function () {
        expect(resource.isValidResourceId('*')).toBe(false);
    });
    it('Resource ids cannot contain equals signs', function () {
        expect(resource.isValidResourceId('=')).toBe(false);
    });
    it('Resource ids cannot contain left square brackets', function () {
        expect(resource.isValidResourceId('[')).toBe(false);
    });
    it('Resource ids cannot contain right square brackets', function () {
        expect(resource.isValidResourceId(']')).toBe(false);
    });
    it('Resource ids cannot contain commas', function () {
        expect(resource.isValidResourceId(',')).toBe(false);
    });
    it('Resource ids cannot contain question marks', function () {
        expect(resource.isValidResourceId('?')).toBe(false);
    });
    it('Resource ids cannot contain left angle brackets (less than signs)', function () {
        expect(resource.isValidResourceId('<')).toBe(false);
    });
    it('Resource ids cannot contain right angle brackets (greater than signs)', function () {
        expect(resource.isValidResourceId('>')).toBe(false);
    });
    it('Resource ids cannot contain hyphens', function () {
        expect(resource.isValidResourceId('-')).toBe(false);
    });
});