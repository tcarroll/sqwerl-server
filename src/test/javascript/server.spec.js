/*globals describe, expect, it, require*/

var converter = require('../../main/javascript/converter');

var r = require('../../main/javascript/router');

var resultsHandler = require('../../main/javascript/query_results_handler');
describe('server', function () {
    'use strict';
    var mockRequest = {
        headers: { accept: 'vnd.sqwerl.org.types+json; version=0.1' },
        session: { data: { user: { id: '/types/users/guest' } } },
        url: '/test/database/types'
    },

        mockResponse = {
            end: function () {
            },

            write: function (content) {
                console.log('CONTENT: ' + content);
            },

            writeHead: function (headerCode, content) {
                var p;
                console.log('STATUS: ' + headerCode);
                console.log('CONTENT: ');
                for (p in content) {
                    if (content.hasOwnProperty(p)) {
                        console.log('  ' + p + ': ' + content.p);
                    }
                }
            }
        },

        mockSecurity = {
            authenticate: function (userName, password, catalog, onSuccess, onFailure) {
                console.log('Authenticating user: ' + userName);
                // TODO - Fetch the account, ignore password, and get the user's handle.
                onSuccess({ 'handle': userName, 'isAuthenticated': true });
            }
        };

    it('Can get types of things', function () {
        var handler = resultsHandler.newInstance(
            /**
             * @param {QueryContext} context
             * @param [error]
             */
            function resourceNotFound(context, error) {
                throw new Error('Couldn\'t find the resource \'' + context.resourceId + '\', Error = ' + error);
            },

            null, /* returnFileCallback */

            /**
             * @param {QueryContext} context
             */
            function returnObject(context) {
                // TODO
                console.log('Result: ' + converter.asJson(context.result));
            },

            /**
             * @param {QueryContext} context
             */
            function userCannotRead(context) {
                throw new Error('User \'' + context.userId + '\' could not read the resource \'' + context.resourceId + '\'');
            }
        ),

            router = new r.Router({
                'applicationName': 'test',
                'catalogDatabaseName': 'catalog',
                'catalogDatabasePath': 'src/test/resources/sqwerl-catalog',
                'clientSourcePath': '../../../../sqwerl-sproutcore-client/client/builds',
                'defaultDatabaseName': 'default',
                'defaultDatabasePath': 'src/test/resources/sqwerl-catalog'
            });
        router.route(handler, router, '/test/default/types', mockRequest, mockResponse);
    });
});