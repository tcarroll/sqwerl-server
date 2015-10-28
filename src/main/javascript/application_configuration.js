/*global process, require*/

/**
 * Loads and manages an application's configuration. An application's configuration information consists of named values,
 * that an application loads from an external source, that control the application's behavior.
 */

/** File system library. */
var fs = require('fs'),

/** This class' logger. */
    logger = require('./logger').newInstance('Configuration');

function requiredConfigurationValue(configuration, valueName, errorMessage) {
    'use strict';
    var value = configuration[valueName];
    if ((!value) || (value.length === 0)) {
        throw new Error(errorMessage);
    }
    return value;
}

/**
 * Constructs, and initializes, an application's configuration information.
 *
 * @param {Object} configuration     Required object that contains configuration information.
 * @constructor
 */
function ApplicationConfiguration(configuration) {
    'use strict';
    var methodName = 'ApplicationConfiguration',
        thisConfiguration = this;
    this.applicationName = requiredConfigurationValue(
        configuration,
        'applicationName',
        'The \'applicationName\' configuration property must specify the application\'s name.'
    );
    this.baseUrl = configuration.baseUrl || 'http://localhost:8080';
    this.catalogDatabaseName = requiredConfigurationValue(
        configuration,
        'catalogDatabaseName',
        'The \'catalogDatabaseName\' configuration property must specify the name of the catalog (master) database.'
    );
    this.catalogDatabasePath = requiredConfigurationValue(
        configuration,
        'catalogDatabasePath',
        'The \'catalogDatabasePath\' configuration property must specify a path to the catalog database.'
    );
    this.clientSourcePath = requiredConfigurationValue(
        configuration,
        'clientSourcePath',
        'The \'clientSourcePath\' configuration property must specify the path to the client application\'s source code.'
    );
    this.defaultDatabaseName = requiredConfigurationValue(
        configuration,
        'defaultDatabaseName',
        'The \'defaultDatabaseName\' configuration property must specify the name of the default (guest) database.'
    );
    this.defaultDatabasePath = requiredConfigurationValue(
        configuration,
        'defaultDatabasePath',
        'The \'defaultDatabasePath\' configuration property must specify the path to the default (guest) database.'
    );
    this.port = configuration.port || 8080;
    this.useHttps = configuration.useHttps;
    Object.keys(thisConfiguration).forEach(function (property) {
        logger.debug(methodName, property, '\'' + thisConfiguration[property] + '\'');
    });
}

/**
 * Reads the given file and uses its contents to create and configure an application's configuration information.
 * This method is synchronous.
 *
 * @param {string} fileName     Required, fully-qualified name of a file that contains configuration information.
 */
function newInstanceFromFile(fileName) {
    'use strict';
    var configuration,
        methodName = 'newInstanceFromFile';
    if ((!fileName) || (fileName.length < 1) || (typeof fileName !== 'string')) {
        throw new Error('A non-null, non-empty configuration file name is required.');
    }
    logger.info(methodName, 'Reading configuration file "' + fileName + '" with current working directory "' + process.cwd() + '"...');
    /*jslint node: true, stupid: true */
    configuration = JSON.parse(fs.readFileSync(fileName));
    logger.info(methodName, 'Finished reading configuration file "' + fileName + '"');
    /*jslint node: true, stupid: false */
    return new ApplicationConfiguration(configuration);
}

/**
 * Constructs, and initializes, a server application's configuration information.
 *
 * @param {Object} configuration     Required object that contains an application's configuration information.
 */
function newInstanceFromObject(configuration) {
    'use strict';
    if (!configuration) {
        throw new Error('Configuration is required.');
    }
    return new ApplicationConfiguration(configuration);
}

exports.newInstanceFromFile = newInstanceFromFile;
exports.newInstanceFromObject = newInstanceFromObject;