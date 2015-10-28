/*globals require*/

/**
 * Sqwerl server application.
 */
var converter = require('./converter'),

    fs = require('fs'),

    logger = require('./logger').newInstance('Server'),

    path = require('path'),

    queryResultsHandler = require('./query_results_handler'),

    security = require('./security'),

    session = require('../../../third-party/sesh/lib/core').session,

    staticFileServer = require('../../../node_modules/node-static'),

    url = require('url');

/*jslint node: true, stupid: true */
var options = {
    key: fs.readFileSync('../../../sqwerl.key'),
    cert: fs.readFileSync('../../../sqwerl.org.crt')
};
/*jslint node: true, stupid: false */

/**
 * Handles when a database returns results from performing a query.
 * @type {QueryResultsHandler}
 */
var resultsHandler = queryResultsHandler.newInstance(
    /**
     * Notifies the client that a database could not find a queried resource.
     *
     * @param {QueryContext} context    Required query information.
     * @param [error]                   Optional error that describes what happened.
     */
    function resourceNotFound(context, error) {
        'use strict';
        var databaseName = context.database.name,
            methodName = 'resourceNotFound',
            response = context.response,
            resourceId = context.resourceId;
        if (error) {
            logger.info(methodName, 'Error: ' + error);
        }
        response.writeHead(404, { 'Content-Type': 'text/plain' });
        if (error.description) {
            response.write(error.description);
        } else {
            response.write('Can\'t find the resource with the ID "' + resourceId + '" in the database "' + databaseName + '".');
        }
        response.end();
        logger.info('Sent 404 to client. Couldn\'t find resource with ID "' + resourceId + '" in the database "' + databaseName + '"');
    },

    /**
     * Returns the contents of a file to the client.
     *
     * @param {QueryContext} context        Required query information.
     * @param {string} qualifiedFileName    Required, fully-qualified (absolute) path to a file.
     */
    function returnFile(context, qualifiedFileName) {
        'use strict';
        var methodName = 'returnFile',
            response = context.response;
        context.database.fileServer.serve(context.request, context.response, function (error) {
            if (error) {
                logger.error(methodName, 'Error returning file "' + qualifiedFileName + '" for the URL "' + context.request.url + '"');
                logger.error(methodName, 'Error: ' + error.message);
                response.writeHead(error.status, error.headers);
                response.end();
            }
        });
    },

    /**
     * Returns information that describes a resource to the client.
     *
     * @param {QueryContext} context    Required query information.
     */
    function returnObject(context) {
        'use strict';
        var methodName = 'returnObject',
            response = context.response,
            result;
        if (context.result) {
            context.result.href = context.configuration.baseUrl +
                    '/' +
                    context.configuration.applicationName +
                    '/' +
                    context.database.name +
                    context.resourceId;
            context.result.id = context.resourceId;
            context.result.path = context.result.path || context.path;
        }
        result = converter.asJson(context.result);
        response.writeHead(200, { 'Content-Type': 'application/vnd.sqwerl-v0.1+json', 'Vary': 'Content-Type' });
        response.write(result);
        response.end();
        logger.info(methodName, 'Returning object: ' + result);
    },

    /**
     * Notifies the user that he or she is not allowed to read a resource.
     *
     * @param {QueryContext} context    Required query information.
     */
    function userCannotRead(context) {
        'use strict';
        var databaseName = context.database.name,
            methodName = 'userCannotRead',
            response = context.response,
            resourceId = context.resourceId;
        response.writeHead(403, { 'Content-Type': 'text/plain' });
        response.write('Unable to query the resource with the ID "' + resourceId + '" from the database "' + databaseName + '".');
        response.end();
        logger.info(methodName, 'Sent 403 to client. The user "' + context.userId + '" is not allowed to read the resource "' + resourceId + '" in the database "' + databaseName + '"');
    }
);

/**
 * Uses HTTP basic authentication to authenticate the user (verify the user's identity).
 *
 * @param request       Required request from client.
 * @param response      Required response to client.
 * @param router        Required client request router.
 */
function authenticateUser(request, response, router) {
    'use strict';
    var header = request.headers.authorization || '',
        token = header.split(/\s+/).pop() || '',
        authentication = new Buffer(token, 'base64').toString(),
        userNameAndPassword = authentication.split(/:/),
        userName = userNameAndPassword[0],
        password = '',
        i,
        methodName = 'authenticateUser';
    if (userNameAndPassword && (userNameAndPassword.length > 1)) {
        password = userNameAndPassword[1].slice(0, userNameAndPassword[1].length);
        i = password.indexOf('\u0000');
        if (i > -1) {
            password = password.substring(0, i);
        }
    }
    security.authenticate(
        router,
        userName,
        password,
        router.catalogDatabase,
        function (user) {
            request.session.auth = true;
            request.session.data.user = { };
            request.session.data.user.id = user.id;
            var alias = 'guest';
            if (user.alias) {
                alias = user.alias;
            } else {
                alias = '/' + user.id.split('/').slice(3).join('/');
            }
            request.session.data.user.alias = alias;
            logger.info(methodName, 'user.id = "' + request.session.data.user.id + '", user.alias = "' + request.session.data.user.alias + '"');
            router.catalogDatabase.fetchUser(
                router.catalogDatabase,
                user.id,
                function (persistentUser) {
                    logger.info(methodName, 'Retrieved data for user "' + user.id + '"');
                    request.session.data.user.persistentUser = persistentUser;
                    response.setHeader('Set-Cookie', request.session.getSetUserNameCookieHeaderValue());
                    response.writeHead(200, { 'Content-Type': 'text/json' });
                    response.write(JSON.stringify(user));
                    response.end();
                }
            );
        },
        function () {
            request.session.auth = false;
            response.writeHead(403, { 'Content-Type': 'text/plain' });
            response.write('Invalid user name or password.');
            response.end();
        }
    );
}

/**
 * Does the given URL contain characters that this server doesn't allow within URLs. This server has strict guidelines to prevent users from accessing information that they aren't allowed to.
 *
 * @param {String} url      Required URL.
 * @returns {boolean}       True if the given URL contains at least one invalid character.
 */
function containsInvalidCharacters(url) {
    'use strict';
    var c, i, isValid = true, methodName = 'server.containsInvalidCharacters';
    for (i = 0; i < url.length; i += 1) {
        c = url.charAt[i];
        if ((c === '.') && (i < url.length) && (url.charAt[i + 1] === '.')) {
            logger.info(methodName, 'Double periods detected at index ' + i);
            isValid = false;
            break;
        }
        if ((c === '!') ||
                (c === '~') ||
                (c === '*') ||
                (c === '\'') ||
                (c === '(') ||
                (c === ')') ||
                (c === '{') ||
                (c === '}') ||
                (c === '|') ||
                (c === '^') ||
                (c === '[') ||
                (c === ']') ||
                (c === '`') ||
                (c === '<') ||
                (c === '>') ||
                (c === '#') ||
                (c === '%') ||
                (c === '"') ||
                (c === '\\')) {
            isValid = false;
            logger.info(methodName, 'The character \'' + c + '\' at index ' + i + ' is not allowed');
            break;
        }
    }
    return !isValid;
}

/**
 * Returns static content from files on the server's file system. Returns the JavaScript, HTML, and CSS code that makes up this server's web client application.
 *
 * @param request           Required request from client.
 * @param response          Required response to client.
 * @param {Router} router   Required client request router.
 */
function serveStaticContent(request, response, router) {
    'use strict';
    var url = request.url,
        start = url.indexOf('static/'),
        fileName,
        methodName = 'serveStaticContent';
    if (start > 0) {
        if (containsInvalidCharacters(url)) {
            logger.info(methodName, 'The url \'' + url + '\' contained illegal characters');
            response.writeHeader(400, 'Illegal characters');
            response.write('400 - The address \'' + url + '\' contains characters not allowed within thing names.');
            response.end();
        } else {
            fileName = path.join(router.clientSourcePath, url);
            logger.info(methodName, 'fileName: ' + fileName);
            fs.exists(router.clientSourcePath, function (exists) {
                if (exists) {
                    fs.readFile(fileName, 'binary', function (error) {
                        if (error && (error.code === 'ENOENT')) {
                            response.writeHead(404, { 'Content-Type': 'text/plain' });
                            response.write('Not found: ' + request.url);
                            response.end();
                        } else {
                            var fileServer = new staticFileServer.Server(router.clientSourcePath, {});
                            fileServer.serve(request, response, function (error) {
                                if (error) {
                                    logger.info(methodName, 'Error returning file for URL: "' + request.url + '".');
                                    logger.error(methodName, 'Error: ' + error.message);
                                    response.writeHead(error.status, error.headers);
                                    response.write(error.message);
                                    response.end();
                                }
                            });
                        }
                    });
                } else {
                    response.writeHeader(404, { 'Content-Type': 'text/plain' });
                    response.write('404 Not Found');
                    response.end();
                }
            });
        }
    } else {
        logger.info(methodName, 'Could not find "' + url + '" under static content path.');
        response.writeHeader(404, 'Not found');
        response.write('404 - Could not find \'' + url + '\'.');
        response.end();
    }
}

/**
 * Starts execution of this web application.
 *
 * @param router        Required object that routes client web requests sent to this server to request handlers.
 * @param searchIndex   Required object that searches for data.
 */
function start(router, searchIndex) {
    'use strict';
    var methodName = 'start';
    if (!router) {
        throw new Error('A non-null route function is required.');
    }
    function onRequest(request, response) {
        var parsedUrl,
            postData = '',
            pathName,
            components,
            user,
            functionName = 'server.onRequest',
            pathStart,
            uri = request.url;
        logger.info(functionName, 'request.url: ' + uri);
        if (containsInvalidCharacters(request.url)) {
            logger.info(methodName, 'The url \'' + uri + '\' contained illegal characters');
            response.writeHeader(400, 'Illegal characters');
            response.write('400 - The address \'' + uri + '\' contains characters not allowed by server.');
            response.end();
        } else {
            parsedUrl = url.parse(uri, true);
            pathName = parsedUrl.pathname;
            logger.info(methodName, 'pathName: ' + pathName);
            components = uri.split('/');
            if (components && (components.length > 0)) {
                pathStart = components[1];
                logger.info(functionName, 'pathStart: ' + pathStart);
                if (pathStart === 'static') {
                    serveStaticContent(request, response, router);
                } else if (components.length > 2) {
                    pathStart = components[2];
                    logger.info(functionName, 'pathStart: ' + pathStart);
                    if (pathStart.slice(0, 6) === 'search') {
                        if (parsedUrl.query.q) {
                            searchIndex.search(decodeURI(parsedUrl.query.q), response);
                        } else {
                            // TODO - Missing search string, return 404 not found.
                            console.log('Search request received, but no search text was provided.');
                        }
                    } else if (pathStart === 'signIn') {
                        authenticateUser(request, response, router);
                    } else if (request.session) {
                        logger.info(functionName, 'session=' + JSON.stringify(request.session));
                        if (request.session.auth === true) {
                            if (pathStart === 'signOut') {
                                request.session.auth = true;
                                user = { };
                                user.id = '/types/users/guest';
                                user.alias = 'guest';
                                request.session.data.user = user;
                                response.setHeader('Set-Cookie', request.session.getSetUserNameCookieHeaderValue());
                                logger.info(functionName, 'User signed out: user.id = "' + request.session.data.user.id + '", user.alias = "' + request.session.data.user.alias + '"');
                                response.writeHeader(200, { 'Content-Type': 'text/plain' });
                                response.write('Signed out.');
                                response.end();
                            } else {
                                logger.info(functionName, 'Received a request for "' + pathName + '" from the user with the ID "' + request.session.data.user.id + '"');
                                request.setEncoding('utf8');
                                request.addListener('data', function (postDataChunk) {
                                    postData += postDataChunk;
                                    logger.info(functionName, 'Received POST data chunk "' + postDataChunk + '".');
                                });
                                request.addListener('end', function () {
                                    router.route(resultsHandler, router, pathName, request, response, postData);
                                });
                            }
                        } else {
                            logger.info(functionName, 'auth: ' + request.session.auth);
                            response.writeHeader(403, { 'Content-Type': 'text/plain' });
                            response.write('403 Forbidden');
                            response.end();
                        }
                    }
                }
            }
        }
    }
    if (router.configuration.useHttps) {
        logger.info(methodName, 'Starting secured server');
        require('https').createServer(options, function (request, response) {
            session(request, response, onRequest);
        }).listen(router.port);
    } else {
        logger.warn(methodName, 'HTTPS not set: Using non-secure HTTP protocol.');
        require('http').createServer(function (request, response) {
            session(request, response, onRequest);
        }).listen(router.port);
    }
    logger.info(methodName, 'Server has started on port ' + router.port + '.');
}

exports.start = start;
