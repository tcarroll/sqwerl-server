/*globals process, require*/

/**
 * The Sqwerl REST server's initial execution point.
 */
var configuration = require('./application_configuration'),

    fs = require('fs'),

    logger = require('./logger').newInstance('Index'),

    router = require('./router'),

    searchIndex = require('./search_index'),

    server = require('./server');

if (process.argv.length > 2) {
    var config = configuration.newInstanceFromFile(process.argv[2]),
        searcher = searchIndex.newInstance(config);
    searcher.load(config.catalogDatabasePath + '/types', function () {
        'use strict';
        searcher.load(config.defaultDatabasePath + '/types', function () {
            server.start(new router.Router(config), searcher);
        });
    });
} else {
    logger.error('Usage: node index <configuration file>');
    logger.error('         Where <configuration file> is a JSON file that specifies this application\'s configuration.');
}