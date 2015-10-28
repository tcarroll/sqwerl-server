/*globals readDataFile, readTypeFile, referenceToPath, require, testAcls, testChildren, testCollections, testPaths, testPropertiesAreInAlphabeticalOrder, testReferences, testThing, typeIdOf, updateAcls*/

/**
 * Tests the integrity of a database of things.
 */

/* This test is synchronous. */
/*jslint node: true, stupid: true*/
var canReadAcl = {
    },

    canWriteAcl = {
    },

    emailValidator = require('./email_validator'),

    fs = require('fs'),

    inverseReferences = {
    },

    /**
     * Regular expression for testing that string values properly encode a date time value in ISO 8601 format.
     */
    iso8601DateTimeRegularExpression = /^\d{4}-[0-1]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d(\.\d+(Z|[+-][0-2]\d:[0-5]\d)?)?$/,

    logger = require('./logger').newInstance('Tester'),

    moment = require('moment'),

    paths = {
    },

    /**
     * Primitive, or built-in, types.
     *
     * @type {Object}
     */
    primitives = {
        'boolean': {
            'checkValue': function (value, propertyName, thingId) {
                'use strict';
                if ((value !== true) && (value !== false)) {
                    throw new Error(
                        'The value of the property "' +
                            propertyName +
                            '" of the thing with the ID "' +
                            thingId +
                            '" must be a Boolean value (true or false).'
                    );
                }
            }
        },
        'email': {
            'checkValue': function (value, propertyName, thingId) {
                'use strict';
                if (value) {
                    if (!emailValidator.validate(value)) {
                        throw new Error(
                            'The value "' +
                                value +
                                '" of the property named "' +
                                propertyName +
                                '" of the thing with the ID "' +
                                thingId +
                                '" is not a valid e-mail address.'
                        );
                    }
                } else {
                    throw new Error(
                        'The property named "' +
                            propertyName +
                            '" of the thing with the ID "' +
                            thingId +
                            '" must contain a valid e-mail address.'
                    );
                }
            }
        },
        'file': {
            'checkValue': function (value, propertyName, thingId) {
                'use strict';
                // TODO - Check that the value refers to a file.
            }
        },
        'integer': {
            'checkValue': function (value, propertyName, thingId) {
                'use strict';
                if ((parseFloat(value) !== parseInt(value, 10)) || isNaN(value)) {
                    throw new Error(
                        'The value of the property "' +
                            propertyName +
                            '" of the thing with the ID "' +
                            thingId +
                            '" must be an integer value.'
                    );
                }
            }
        },
        'objects': {
            'checkValue': function (value, propertyName, thingId) {
                'use strict';
                // TODO - Check that the value is an object.
                logger.info('checkValue', 'Checking object value: Unimplemented functionality. Checking object value "' + value + '", propertyName = "' + propertyName + '", thingId = "' + thingId + '"');
            }
        },
        'representations': {
            'checkValue': function (value, propertyName, thingId, folder) {
                'use strict';
                var components,
                    file,
                    representation;
                if (value && (!(value instanceof Array) && (value instanceof Object))) {
                    if (folder) {
                        components = folder.split('/');
                        folder = components.slice(0, components.length - 1).join('/');
                    }
                    Object.keys(value).forEach(function (id) {
                        if (value.hasOwnProperty(id)) {
                            file = folder + thingId + '/' + id;
                            if (fs.existsSync(file)) {
                                representation = value[id];
                                if (representation && (!(representation instanceof Array) && (representation instanceof Object))) {
                                    updateAcls(thingId + '/' + id, representation);
                                }
                            } else {
                                throw new Error(
                                    'The representation with the ID "' +
                                        id +
                                        '" of the thing with the ID "' +
                                        thingId +
                                        '" does not have a corresponding file at "' +
                                        file +
                                        '".'
                                );
                            }
                        }
                    });
                }
            }
        },
        'text': {
            'checkValue': function (value, propertyName, thingId) {
                'use strict';
                if ((typeof value) !== 'string') {
                    throw new Error(
                        'The value of the property "' +
                            propertyName +
                            '" of the thing with the ID "' +
                            thingId +
                            '" must be a text string.'
                    );
                }
            }
        },
        'timestamp': {
            'checkValue': function (value, propertyName, thingId) {
                'use strict';
                if ((typeof value) !== 'string') {
                    throw new Error(
                        'The value of the property "' +
                            propertyName +
                            '" of the thing with the ID "' +
                            thingId +
                            '" must be a text string date time in ISO 8602 format.'
                    );
                }
                if (iso8601DateTimeRegularExpression.exec(value) === null) {
                    throw new Error(
                        'The value "' +
                            value +
                            '" of the property "' +
                            propertyName +
                            '" of the thing with the ID "' +
                            thingId +
                            '" must be an ISO 8601 date time value (for example: "2014-11-21T00:00:00.000-07:00".'
                    );
                }
                var date = moment(value, 'YYYY-MM-DDTHH:mm:ss.SSZ');
                logger.info('checkValue', 'Parsed timestamp "' + value + '" to date time "' + date.format() + '"');
            }
        },
        'unsignedInteger': {
            'checkValue': function (value, propertyName, thingId) {
                'use strict';
                var i = parseInt(value, 10);
                if (((parseFloat(value) !== i) || isNaN(value)) || (i < 0)) {
                    throw new Error(
                        'The value of the property "' +
                            propertyName +
                            '" of the thing with the ID "' +
                            thingId +
                            '" must be a non-negative integer.'
                    );
                }
            }
        },
        'url': {
            'checkValue': function (value, propertyName, thingId) {
                'use strict';
                // TODO - Check that the value is a valid Uniform Resource Locator.
                logger.info('checkValue', 'Unimplemented functionality - Checking URL value = "' + value + '", propertyName = "' + propertyName + '", thingId = "' + thingId + '"');
            }
        }
    },

    resource = require('./resource'),

    sortedCollections = {
    },

    /**
     * Persistent things.
     * @type {Object}
     */
    things = {
    },

    /**
     * Metadata that defines persistent things.
     * @type {Object}
     */
    types = {
        /**
         * The definition (schema) for objects that define a type (class) of thing.
         * @type {Object}
         */
        'types': {
            properties: {
                canRead: {
                    description: 'The users and groups of users allowed to read a type definition.',
                    name: 'Can read',
                    required: false,
                    shortDescription: 'Who can view a type of thing\'s properties?',
                    sortedBy: ['name'],
                    type: {
                        '</types>': ''
                    }
                },
                canWrite: {
                    description: 'The user and groups of users allowed to change a type definition.',
                    name: 'Can write',
                    required: false,
                    shortDescription: 'Who can change a type of thing\'s properties?',
                    sortedBy: ['name'],
                    type: {
                        '</types>': ''
                    }
                },
                'children': {
                    'description': 'A thing\'s children.',
                    'name': 'Children',
                    'required': false,
                    'shortDescription': 'A composite thing\'s child things.',
                    'type': {
                        '</types>': ''
                    }
                },
                creator: {
                    description: 'The user who created a type of thing.',
                    inverse: 'created',
                    name: 'Created by',
                    required: true,
                    shortDescription: 'A type\'s creator.',
                    type: '</types/users>'
                },
                createdOn: {
                    description: 'The date and time when a type definition was created.',
                    name: 'Created on',
                    required: true,
                    shortDescription: 'Creation time and date.',
                    type: 'timestamp'
                },
                description: {
                    description: 'Text that describes a type (class) of things that have similar properties.',
                    name: 'Description',
                    required: false,
                    shortDescription: 'Describes a type of things.',
                    type: 'text'
                },
                'extends': {
                    description: 'A type that a new type extends (enhances).',
                    name: 'Extends',
                    required: true,
                    shortDescription: 'The type that this type is based on.',
                    type: '</type>'
                },
                facets: {
                    description: 'Named collections of properties common to a type of thing.',
                    inverse: 'faceted',
                    name: 'Facets',
                    required: false,
                    shortDescription: 'Facets of what a type of thing is.',
                    sortedBy: ['name'],
                    type: {
                        '</types/facets>': ''
                    }
                },
                name: {
                    description: 'The name for a type (class) of thing.',
                    name: 'Name',
                    required: true,
                    shortDescription: 'Type name.',
                    type: 'text'
                },
                owner: {
                    description: 'The user who owns a type definition.',
                    inverse: 'owns',
                    name: 'Owner',
                    required: true,
                    shortDescription: 'A type definition\'s owner.',
                    type: '</types/users>'
                },
                path: {
                    description: 'The names of the types of things that define the path that identifies this type of thing.',
                    name: 'Path',
                    required: true,
                    shortDescription: 'The path to this type of thing.',
                    type: 'text'
                },
                properties: {
                    description: 'The properties that all things of the type may have.',
                    name: 'Properties',
                    required: true,
                    shortDescription: 'Properties common to a type of thing.',
                    type: 'objects'
                },
                shortDescription: {
                    description: 'Text that describes a type definition in less than 80 characters.',
                    name: 'Short description',
                    shortDescription: 'Text that briefly describes a type of object.',
                    type: 'text'
                },
                sortedBy: {
                    description: 'The names of the properties that members of a collection of things are sorted by.',
                    name: 'Sorted by',
                    shortDescription: 'Sorted by',
                    type: ['text']
                }
            }
        }
    },

    worker = require('./throttled_worker').newInstance();

/**
 * If a given collection of things is supposed to be sorted, adds the collection to a list of collections to test for sort order.
 *
 * @param {String} folder
 * @param {String} thingId
 * @param {String} propertyName
 * @param {Object} propertyDefinition
 * @param {Array} collection
 */
function addCollection(folder, thingId, propertyName, propertyDefinition, collection) {
    'use strict';
    var collectionId;
    if (collection && (collection.length > 1) && propertyDefinition.hasOwnProperty('sortedBy')) {
        collectionId = thingId + '.' + propertyName;
        if (!sortedCollections.hasOwnProperty(collectionId)) {
            sortedCollections[collectionId] = {
                collectionPropertyName: propertyName,
                folder: folder,
                references: collection,
                sortedBy: propertyDefinition.sortedBy,
                thingId: thingId
            };
        }
    }
}

/**
 * Adds a reference to a thing to a collection of references.
 *
 * @param thingId               Required unique identifier of the thing that contains a reference to another thing.
 * @param type                  Required object that defines the type of thing that contains a reference to another thing.
 * @param {String} property     Required name of the thing's property that contains a reference to another thing.
 * @param value                 Required reference value.
 */
function addReference(thingId, type, property, value) {
    'use strict';
    var inverse,
        key,
        methodName = 'addReference';
    logger.info(methodName, 'thingId = "' + thingId + '", type = "' + type.name + '", property = "' + property + '", value = "' + value + '"');
    if (type.properties[property] && type.properties[property].hasOwnProperty('inverse')) {
        key = (value.trim()[1] === '/') ? value.substring(1, value.length - 1) : thingId + '/' + value.substring(1, value.length - 1);
        if (!inverseReferences[key]) {
            inverseReferences[key] = { };
        }
        inverse = type.properties[property].inverse;
        if (!inverseReferences[key][inverse]) {
            inverseReferences[key][inverse] = { };
        }
        inverseReferences[key][inverse][thingId] = '';
    }

    if (!things[thingId]) {
        things[thingId] = { };
    }
    if (!things[thingId][property]) {
        things[thingId][property] = { };
    }
    if (value.trim()[1] === '/') {
        things[thingId][property][value.substring(1, value.length - 1)] = '';
    } else {
        things[thingId][property][thingId + '/' + value.substring(1, value.length - 1)] = '';
    }
}

/**
 * Do the facets of a type of thing define a property?
 *
 * @param type          Required type of thing.
 * @param thingId       Required unique identifier of a thing of the given type.
 * @param property      Required name of a property of the given thing.
 * @param reference     Required reference to a persistent thing.
 * @return {boolean}    True if the given property of the given object is defined by one of the given type's facets.
 */
function definedByFacet(type, thingId, property, reference) {
    'use strict';
    var facetId,
        facetProperty,
        facetType,
        foundDefinition = false,
        referencedTypeId = typeIdOf(reference),
        referencedType = types[referencedTypeId];
    if (!referencedType) {
        throw new Error('Can\'t find a thing with the id "' + reference + '"');
    }
    // If the type of referenced object is defined in terms of facets, then go through the type's facets
    // to find the definition of a property that can refer to the given thing.
    if (referencedType.facets) {
        for (facetId in referencedType.facets) {
            if (referencedType.facets.hasOwnProperty(facetId)) {
                facetType = types[facetId.slice(1, facetId.length - 1)];
                for (facetProperty in facetType.properties) {
                    if (facetType.properties.hasOwnProperty(facetProperty)) {
                        if (facetType.properties[facetProperty].inverse === property) {
                            foundDefinition = true;
                            addReference(thingId, type, property, reference);
                            break;
                        }
                    }
                }
            }
        }
    }
    return foundDefinition;
}

function exists(folder, parentFolder, thing) {
    'use strict';
    var doesExist = fs.existsSync(folder + thing);
    if (!doesExist) {
        if (parentFolder) {
            doesExist = fs.statSync(parentFolder + thing);
        }
    }
    return doesExist;
}

/**
 * Retrieves thing's sort keys. Returns the values of a thing's properties that the thing is sorted by.
 *
 * @param {String} folder
 * @param {String} thingId
 * @param {Array} properties
 * @param {function} next
 */
function fetchKeys(folder, parentFolder, thingId, properties, next) {
    'use strict';
    var file = folder + '/' + thingId.split('/').slice(2).join('/') + '/thing.json';
    fs.stat(file, function (error) {
        if (error && parentFolder) {
            fetchKeys(parentFolder, null, thingId, properties, next);
        } else {
            fs.readFile(file, function (error2, data) {
                var key = '',
                    thing;
                if (error2) {
                    // TODO
                    console.log('Failed to read file');
                } else {
                    thing = JSON.parse(data);
                    properties.forEach(function (propertyName) {
                        key += thing[propertyName];
                    });
                    next(key);
                }
            });
        }
    });
}

/**
 * Returns the unique identifier for the thing that a file with the given name represents.
 *
 * @param {String} file     A required file name.
 * @return {String}         A persistent thing's unique identifier.
 */
function fileToId(file) {
    'use strict';
    var id = '',
        a = file.split('/'),
        isPath = false,
        i,
        methodName = 'fileToId';
    for (i = 0; i < a.length - 1; i += 1) {
        if (a[i] === 'types') {
            isPath = true;
        }
        if (isPath) {
            id += '/' + a[i];
        }
    }
    logger.info(methodName, 'file = "' + file + '", id = "' + id + '"');
    return id;
}

/**
 * Checks to see if a file exists within a database.
 *
 * @param path      Required file's resource ID.
 * @param folder    Required folder where a database's data are stored.
 * @return {Boolean} true if the file exists within of the given folder (or one of its sub-folders).
 */
function findFile(path, folder) {
    'use strict';
    var wasFound = false,
        components = referenceToPath(path).split('/'),
        folderComponents = folder.split('/'),
        targetFolder = folder + '/' + components.slice(2, components.length - 1).join('/'),
        file = components.pop(),
        files,
        i,
        methodName = 'findFile',
        fileToFind = folderComponents.slice(0, folderComponents.length - 1).join('/') + '/' + components.slice(1, components.length).join('/') + '/' + file;
    logger.info(methodName, 'Looking for file "' + fileToFind + '", folder "' + targetFolder + '"');
    try {
        files = fs.readdirSync(targetFolder);
        for (i = 0; i < files.length; i += 1) {
            if (file === files[i]) {
                wasFound = true;
                break;
            }
        }
    } catch (error) {
        logger.info(methodName, 'Couldn\'t find file "' + fileToFind + '"');
    }
    return wasFound;
}

function finished() {
    'use strict';
    var methodName = 'finished';
    logger.info(methodName, 'Finished testing ' + Object.keys(things).length.toLocaleString() + ' things and ' + Object.keys(types).length.toLocaleString() + ' types.');
}

/**
 * Loads data from a collection of files.
 *
 * @param {String} [parent]         Optional parent folder that contains a database of things.
 * @param {String} dataFilename     Required name of the files that contain the data that we want to load.
 * @param readDataCallback          Required function to invoke to read a data file.
 * @param [next]                    An optional callback function to invoke to get the next file or folder to load.
 * @param [loadParentCallback]      Optional callback function invoked after all type information has been read from the given folder's child folders.
 * @param [nextLoadCallback]        Optional callback function invoked to load more information after the load function finishes loading.
 */
function load(parent, dataFilename, readDataCallback, next, loadParentCallback, nextLoadCallback) {
    'use strict';
    var base = parent,
        methodName = 'load',
        work = [ ];
    fs.stat(base, function (error, status) {
        if (error) {
            logger.error(methodName, 'Could not read file "' + base + '".');
        } else {
            if (status.isDirectory()) {
                fs.readdir(base, function (error, files) {
                    if (error) {
                        logger.error(methodName, error);
                    } else {
                        files.forEach(function (f) {
                            if (f[0] !== '.') {
                                if (!resource.isValidResourceId(f)) {
                                    throw new Error('The name of the file "' + base + '/' + f + '" contains invalid characters.');
                                }
                                work.push(function (next) {
                                    load(base + '/' + f, dataFilename, readDataCallback, next, loadParentCallback);
                                });
                            }
                        });
                        worker.doWork(work, function () {
                            if (next) {
                                next(null);
                            } else if (loadParentCallback) {
                                loadParentCallback(nextLoadCallback);
                            }
                        });
                    }
                });
            } else {
                if (base.split('/').pop() === dataFilename) {
                    readDataCallback(base, next);
                } else {
                    next(null);
                }
            }
        }
    });
}

/**
 * Loads things.
 *
 * @param folder                Required folder that contains files that defines things.
 * @param [loadParentCallback]  Optional callback function invoked after things have been loaded from the given folder.
 */
function loadThings(folder, loadParentCallback) {
    'use strict';
    load(folder, 'thing.json', function (file, next) {
        readDataFile(folder, file, next);
    }, null, loadParentCallback, null);
}

/**
 * Loads objects that define the properties of types of persistent things.
 *
 * @param {String} folder                   Required folder that contains files that define types of things.
 * @param {Function} [loadParentCallback]   Optional callback function invoked after all type information has been loaded from the given folder.
 */
function loadTypes(folder, loadParentCallback) {
    'use strict';
    load(
        folder,
        'type.json',
        function (file, next) {
            readTypeFile(folder, file, next);
        },
        null,
        loadParentCallback,
        function () {
            loadThings(folder, loadParentCallback);
        }
    );
}

/**
 * Reads, and parses, a file that defines a thing (a book, an author, a web page, and so on).
 *
 * @param {String} folder   Required folder that contains files that define types of things.
 * @param {String} file     Required file whose contents define a thing's properties.
 * @param {Function} next   Required function to invoke to load the next data file.
 */
function readDataFile(folder, file, next) {
    'use strict';
    var collection = [], components, thing, i, id, typeId,
        methodName = 'readDataFile',
        path,
        thingId,
        value;
    logger.info(methodName, 'Reading data file "' + file + '"');
    fs.readFile(file, function (error, data) {
        var expression, property, p;
        if (error) {
            logger.error(methodName, error);
        } else {
            try {
                thing = JSON.parse(data);
                testPropertiesAreInAlphabeticalOrder(file, thing);
            } catch (e) {
                logger.info(methodName, 'Error occurred while loading thing metadata file "' + file + '".');
                throw e;
            }
            id = fileToId(file);
            typeId = '';
            components = id.split('/');
            typeId = components.slice(0, components.length - 1).join('/');
            thingId = fileToId(file);
            things[thingId] = { };
            paths[id] = { name: thing.name, path: thing.path };
            for (property in thing) {
                if (thing.hasOwnProperty(property)) {
                    value = thing[property];
                    things[thingId][property] = { };
                    if (typeof value === 'string') {
                        expression = value.trim();
                        // If the value is a reference to a persistent thing, then add the reference.
                        if (expression.indexOf('<') === 0) {
                            // If the reference is an absolute reference (a path from the root of a database of
                            // persistent things) then add the reference. Otherwise, the reference is a relative
                            // reference (a path from some other persistent thing). Then convert the relative
                            // reference to an absolute reference and add that absolute reference.
                            if (expression.charAt(1) === '/') {
                                things[thingId][property][referenceToPath(expression)] = '';
                            } else {
                                things[thingId][property][thingId + '/' + referenceToPath(expression)] = '';
                            }
                        }
                    } else {
                        if (value instanceof Array) {
                            for (i = 0; i < value.length; i += 1) {
                                if (typeof value[0] === 'string') {
                                    // TODO - Duplicated from above. Refactor.
                                    expression = value[0].trim();
                                    // If the value is a reference to a persistent thing, then add the reference.
                                    if (expression.indexOf('<') === 0) {
                                        // If the reference is an absolute reference (a path from the root of a database of
                                        // persistent things) then add the reference. Otherwise, the reference is a relative
                                        // reference (a path from some other persistent thing). Then convert the relative
                                        // reference to an absolute reference and add that absolute reference.
                                        if (expression.charAt(1) === '/') {
                                            path = referenceToPath(expression);
                                            things[thingId][property][path] = '';
                                        } else {
                                            path = thingId + '/' + referenceToPath(expression);
                                            things[thingId][property][path] = '';
                                        }
                                        collection.push(path);
                                    }
                                }
                            }
                        } else {
                            if (value instanceof Object) {
                                for (p in value) {
                                    if (value.hasOwnProperty(p)) {
                                        // TODO - Duplicated from above. Refactor.
                                        expression = p;
                                        // If the value is a reference to a persistent thing, then add the reference.
                                        if (expression.indexOf('<') === 0) {
                                            things[thingId][p] = { };
                                            // If the reference is an absolute reference (a path from the root of a database of
                                            // persistent things) then add the reference. Otherwise, the reference is a relative
                                            // reference (a path from some other persistent thing). Then convert the relative
                                            // reference to an absolute reference and add that absolute reference.
                                            if (expression.charAt(1) === '/') {
                                                path = referenceToPath(expression);
                                                things[thingId][property][path] = '';
                                            } else {
                                                path = thingId + '/' + referenceToPath(expression);
                                                things[thingId][property][path] = '';
                                            }
                                            collection.push(path);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            testChildren(file, thing);
            testThing(folder, typeId, id, thing, { }, { }, false);
            next(thing);
        }
    });
}

/**
 * Reads, and parses, a file that defines a type of thing.
 *
 * @param folder    Required folder that contains files that define types of things.
 * @param file      Required file whose contents define the properties of a type of thing.
 * @param next      Required function invoked to load the next type file.
 */
function readTypeFile(folder, file, next) {
    'use strict';
    var typeObject, typeId, methodName = 'readTypeFile';
    fs.readFile(file, function (error, data) {
        if (error) {
            logger.error(methodName, error);
        } else {
            typeId = fileToId(file);
            try {
                typeObject = JSON.parse(data);
                types[typeId] = typeObject;
                testThing(folder, '/types', typeId, typeObject, { }, { }, true);
            } catch (e) {
                logger.error(methodName, 'Error occurred while loading type definition file "' + file + '".\n' + e);
                throw e;
            }
            next(typeObject);
        }
    });
}

/**
 * Returns the path part of a thing reference. Checks that the given reference starts with a less than sign and
 * ends with a greater than sign and returns everything between the less than and greater than sign.
 *
 * @param {String} reference     Required reference to a persistent thing.
 * @return {String} The path to the persistent thing that the given reference refers to.
 */
function referenceToPath(reference) {
    'use strict';
    var methodName = 'referenceToPath',
        path;
    logger.debug(methodName, 'Converting reference "' + reference + '" to path');
    if ((reference.charAt(0) !== '<') || (reference.charAt(reference.length - 1) !== '>')) {
        throw new Error(
            'The reference "' +
                reference +
                '" is not enclosed within less than and greater than signs.'
        );
    }
    path = reference.slice(1, reference.length - 1);
    logger.debug(methodName, 'path = "' + path + '"');
    return path;
}

/**
 * Tests the files that contain the information that makes up a database of things.
 *
 * @param {String} folder            Required folder that contains files that define a database of things.
 * @param {String} [parentFolder]    Optional folder that contains files that define a parent database of things. A parent database contains things that its child databases may share.
 */
function test(folder, parentFolder) {
    'use strict';
    var methodName = 'test';
    logger.info(methodName, 'Testing things...');
    loadTypes(
        folder,
        parentFolder ?
                function () {
                    load(
                        parentFolder,
                        'type.json',
                        function (file, next) { readTypeFile(folder, file, next); },
                        null,
                        function () {
                            loadThings(
                                folder,
                                parentFolder ?
                                        function () {
                                            loadThings(parentFolder, function () {
                                                testReferences(folder, parentFolder);
                                                testAcls(folder, parentFolder);
                                                testCollections(folder, parentFolder, function () {
                                                    testPaths();
                                                    finished();
                                                });
                                            });
                                        } : null
                            );
                        },
                        null
                    );
                } :
                function () {
                    loadThings(folder, function () {
                        testReferences(folder, parentFolder);
                        testAcls(folder, parentFolder);
                        testCollections(folder, parentFolder, function () {
                            testPaths();
                            finished();
                        });
                    });
                }
    );
}

/**
 * Test access control lists (ACLs).
 *
 * @param folder            Required root folder of a database of things.
 * @param [parentFolder]    Optional root folder of a parent database of things.
 */
function testAcls(folder, parentFolder) {
    'use strict';
    var acl,
        components,
        id,
        parentAcl,
        t;
    if (parentFolder) {
        components = parentFolder.split('/');
        parentAcl = JSON.parse(fs.readFileSync(components.slice(0, components.length - 1).join('/') + '/read_acls.json'));
    }
    components = folder.split('/');
    acl = JSON.parse(fs.readFileSync(components.slice(0, components.length - 1).join('/') + '/read_acls.json'));
    for (id in canReadAcl) {
        if (canReadAcl.hasOwnProperty(id)) {
            if (acl.hasOwnProperty(id)) {
                for (t in canReadAcl[id]) {
                    if (canReadAcl[id].hasOwnProperty(t)) {
                        if (acl[id][t] === canReadAcl[id][t]) {
                            delete acl[id][t];
                        }
                    }
                }
                if (Object.keys(acl[id]) > 0) {
                    throw new Error('Read ACL mismatch for the thing with the id "' + id + '".');
                }
                delete canReadAcl[id];
            } else {
                if (parentAcl && parentAcl.hasOwnProperty(id)) {
                    for (t in canReadAcl[id]) {
                        if (canReadAcl[id].hasOwnProperty(t)) {
                            if (parentAcl[id][t] === canReadAcl[id][t]) {
                                delete parentAcl[id][t];
                            }
                        }
                    }
                    if (Object.keys(parentAcl[id]) > 0) {
                        throw new Error('Read ACL mismatch for the thing with the id "' + id + '".');
                    }
                    delete canReadAcl.id;
                } else {
                    throw new Error(
                        'Missing read access control list for the thing with the id "' + id + '".'
                    );
                }
            }
        }
    }
    if (canReadAcl.length > 0) {
        throw new Error('There are unmatched read access control lists.');
    }
}

/**
 * Tests that a thing's children property contains references to a thing's children. For a given persistent thing
 * defined in the given file, test that all things defined in child folders of the folder containing the given
 * file are referenced within the given thing's 'children' property.
 *
 * @param {string} file     Required file whose contents define a persistent thing.
 * @param {Object} thing    Required persistent thing (defined by the contents of the given file).
 */
function testChildren(file, thing) {
    'use strict';
    var files,
        folder = file.substring(0, file.lastIndexOf('/')),
        status;
    status = fs.statSync(folder);
    if (status.isDirectory()) {
        files = fs.readdirSync(folder);
        files.forEach(function (f) {
            var id,
                path = folder + '/' + f,
                s = fs.statSync(path),
                subFiles;
            if (s.isDirectory()) {
                subFiles = fs.readdirSync(path);
                subFiles.forEach(function (subFile) {
                    if (subFile === 'thing.json') {
                        id = fileToId(path + '/' + subFile);
                        if (thing.hasOwnProperty('children')) {
                            if (!thing.children.hasOwnProperty('<' + id + '>')) {
                                throw new Error(
                                    'The "children" property of the thing with the ID "' +
                                        fileToId(path) +
                                        '" is missing a reference to the child "' +
                                        '<' +
                                        id +
                                        '>".'
                                );
                            }
                        } else {
                            throw new Error(
                                'The thing with the ID "<' +
                                    fileToId(path + '/' + subFile) +
                                    '>" has children but doesn\'t have a "children" property.'
                            );
                        }
                    }
                });
            }
        });
    }
}

function testCollection(folder, parentFolder, collectionId, done) {
    'use strict';
    var collection = sortedCollections[collectionId],
        methodName = 'testCollection',
        work = [];
    collection.references.forEach(function (reference) {
        work.push(function (next) {
            fetchKeys(folder, parentFolder, referenceToPath(reference), collection.sortedBy, next);
        });
    });
    worker.doWork(
        work,
        function (keys) {
            var previousKey = null;
            logger.info(
                methodName,
                'Testing the values of the properties "' +
                    collection.sortedBy +
                    '" of the things within the collection "' +
                    collectionId +
                    '" for their sort order'
            );
            keys.forEach(function (key) {
                if (previousKey && previousKey[0] && (previousKey[0].toLowerCase() > key[0].toString().toLowerCase())) {
                    throw new Error(
                        'The values of the property named "' +
                            collection.collectionPropertyName +
                            '" of the thing with the ID "<' +
                            collection.thingId +
                            '>" are not in the proper sort order.\n' +
                            'The value "' +
                            previousKey[0] +
                            '" does not come before the value "' +
                            key[0] +
                            '".'
                    );
                }
                previousKey = key;
            });
            done();
        }
    );
}

/**
 * Test sort order of members of sorted collections of things.
 *
 * @param folder            Required root folder of a database of things.
 * @param [parentFolder]    Optional root folder of a parent database of things.
 */
function testCollections(folder, parentFolder, successFunction) {
    'use strict';
    var collectionId,
        id,
        work = [];
    for (collectionId in sortedCollections) {
        if (sortedCollections.hasOwnProperty(collectionId)) {
            id = collectionId;
            work.push((function (id) {
                return function (next) {
                    testCollection(folder, parentFolder, id, next);
                };
            })(id));
        }
    }
    worker.doWork(
        work,
        function () {
            delete sortedCollections[collectionId];
            if (Object.keys(sortedCollections).length === 0) {
                successFunction();
            }
        }
    );
}

/**
 * Tests things' path properties.
 */
function testPaths() {
    'use strict';
    var i,
        id,
        idComponents,
        methodName = 'testPaths',
        name,
        path,
        pathComponents,
        x;
    for (id in paths) {
        if (paths.hasOwnProperty(id)) {
            logger.info(methodName, 'Testing paths "' + id + '"');
            path = paths[id].path;
            logger.info(methodName, id + '.path = ' + path);
            pathComponents = path.split('/');
            name = pathComponents[pathComponents.length - 1];
            if (paths[id].name !== name) {
                throw new Error(
                    'The name of the thing with the id "' +
                        id +
                        '" does not match the name in the thing\'s path: "' +
                        name +
                        '"'
                );
            }
            idComponents = id.split('/');
            for (i = 1; i < idComponents.length - 1; i += 1) {
                x = idComponents.slice(0, i + 1).join('/');
                if (paths[x] && (paths[x].name !== pathComponents[i])) {
                    throw new Error(
                        'The name "' +
                            pathComponents[i] +
                            '" within the path "' +
                            path +
                            '" of the object with the id "' +
                            id +
                            '" does not match the name of a thing on the path.'
                    );
                }
            }
        }
    }
}

/**
 * Tests that a things properties are defined in ascending alphabetical order.
 *
 * @param file   Required file whose contents define a persistent thing.
 * @param thing  A persistent thing created from the given file's contents.
 */
function testPropertiesAreInAlphabeticalOrder(file, thing) {
    'use strict';
    var index = 0,
        methodName = 'testPropertiesAreInAlphabeticalOrder',
        needsReordering = false,
        p,
        properties = [],
        property;
    for (property in thing) {
        if (thing.hasOwnProperty(property)) {
            properties.push(property);
        }
    }
    properties.sort();
    for (p in thing) {
        if (thing.hasOwnProperty(p)) {
            if (properties[index] !== p) {
                logger.warn(methodName,
                    'The property "' +
                    p +
                    '" of the thing with the id "' +
                    fileToId(file) +
                    '" is not in alphabetical order.');
                needsReordering = true;
            }
            /*
             throw new Error(
             'The property "' +
             property +
             '" of the thing with the id '" +
             fileToId(file) +
             '" is not in alphabetical order.'
             );
             */
            index += 1;
        }
    }
    if (needsReordering) {
        index = 0;
        logger.warn(methodName, '{');
        properties.forEach(function (property) {
            var buffer = '    "' + property + '\': ',
                i,
                length,
                v,
                value = thing[property];
            if (typeof value === 'string') {
                buffer += '"' + thing[property] + '"';
                index += 1;
            } else if (Array.isArray(value)) {
                i = 0;
                length = value.length;
                buffer += '[\n';
                value.forEach(function (v) {
                    buffer += '        "';
                    buffer += v;
                    buffer += '"';
                    if (i < (length - 1)) {
                        buffer += ',\n';
                    } else {
                        buffer += '\n';
                    }
                    i += 1;
                });
                buffer += '    ]';
                index += 1;
            } else if (typeof value === 'object') {
                i = 0;
                length = 0;
                for (v in value) {
                    if (value.hasOwnProperty(v)) {
                        length += 1;
                    }
                }
                buffer += '{\n';
                for (v in value) {
                    if (value.hasOwnProperty(v)) {
                        buffer += '        "';
                        buffer += v;
                        buffer += '": ""';
                        if (i < (length - 1)) {
                            buffer += ',\n';
                        } else {
                            buffer += '\n';
                        }
                        i += 1;
                    }
                }
                buffer += '    }';
                index += 1;
            }
            if (index < (properties.length - 1)) {
                buffer += ',';
            }
            logger.warn(methodName, buffer);
        });
        logger.warn(methodName, '}');
    }
}

/**
 * Tests that all references to persistent things actually refer to persistent things within a database of
 * persistent things.
 *
 * @param folder            Required root folder of a database of things.
 * @param [parentFolder]    Optional root folder of a parent database of things.
 */
function testReferences(folder, parentFolder) {
    'use strict';
    var components,
        methodName = 'testReferences',
        existingThings = { },
        thing,
        property,
        p2,
        wasFound,
        sourceType,
        sourceTypeId,
        parentComponents,
        propertyDefinition,
        inverseExists,
        reference,
        i;
    for (thing in things) {
        if (things.hasOwnProperty(thing)) {
            logger.info(methodName, 'Testing references "' + thing + '"');
            for (property in things[thing]) {
                if (things[thing].hasOwnProperty(property)) {
                    logger.info(methodName, 'things[thing][property] === things["' + thing + '"]["' + property + '"] = "' + things[thing][property] + '"');
                    for (p2 in things[thing][property]) {
                        if (things[thing][property].hasOwnProperty(p2)) {
                            logger.info(methodName, 'Testing reference of "' + thing + '["' + p2 + '"]');
                            if ((!things.hasOwnProperty(p2)) && (!existingThings.hasOwnProperty(p2))) {
                                logger.info(methodName, 'Looking for file referenced by id "' + p2 + '"');
                                wasFound = findFile('<' + p2 + '>', folder);
                                if ((wasFound === false) && parentFolder) {
                                    wasFound = findFile('<' + p2 + '>', parentFolder);
                                }
                                if (wasFound) {
                                    existingThings[p2] = '';
                                    if (!resource.isValidResourceId(referenceToPath('<' + p2 + '>'))) {
                                        throw new Error('The resource name "' + p2 + '" contains invalid characters.');
                                    }
                                    logger.info(methodName, 'Found referenced file "' + p2 + '"');
                                } else {
                                    throw new Error(
                                        'The property "' +
                                            property +
                                            '" of the thing with the ID "' +
                                            thing +
                                            '" refers to a thing with the ID "' +
                                            p2 +
                                            '" that doesn\'t exist.'
                                    );
                                }
                            } else {
                                logger.info(methodName, 'Found referenced object "' + p2 + '"');
                            }
                        }
                    }
                }
            }
        }
    }
    components = folder.split('/');
    folder = components.slice(0, components.length - 1).join('/');
    if (parentFolder) {
        parentComponents = parentFolder.split('/');
        parentFolder = parentComponents.slice(0, parentComponents.length - 1).join('/');
    }
    for (thing in inverseReferences) {
        if (inverseReferences.hasOwnProperty(thing)) {
            logger.info(methodName, 'Testing inverse references to "' + thing + '"');
            for (property in inverseReferences[thing]) {
                if (inverseReferences[thing].hasOwnProperty(property)) {
                    for (p2 in inverseReferences[thing][property]) {
                        if (inverseReferences[thing][property].hasOwnProperty(p2)) {
                            logger.info(methodName, 'Testing inverse reference to "' + p2 + '" from "' + thing + '"["' + property + '"]');
                            if (!existingThings.hasOwnProperty(p2)) {
                                if (!exists(folder, parentFolder, p2)) {
                                    throw new Error(
                                        'The property "' +
                                            property +
                                            '" of the thing with the ID "' +
                                            thing +
                                            '" must refer back to the thing with the ID "' +
                                            p2 +
                                            '" that doesn\'t exist.'
                                    );
                                }
                                existingThings[p2] = '';
                            }
                            sourceTypeId = thing.split('/').slice(0, 3).join('/');
                            sourceType = types[sourceTypeId];
                            if (!sourceType) {
                                throw new Error(
                                    'Could not find a source type with the id "' +
                                        sourceTypeId +
                                        '" referenced by the property "' +
                                        property +
                                        '" of the thing "' +
                                        thing +
                                        '".'
                                );
                            }
                            propertyDefinition = sourceType.properties[property];
                            inverseExists = false;
                            if (propertyDefinition) {
                                if (!things[thing]) {
                                    throw new Error('Could not find the thing with the ID "' + thing + '".');
                                }
                                reference = things[thing][property];
                                if (typeof reference === 'string') {
                                    inverseExists = (reference === p2);
                                } else if (reference instanceof Array) {
                                    for (i = 0; i < reference.length; i += 1) {
                                        if (p2 === reference[i]) {
                                            inverseExists = true;
                                            break;
                                        }
                                    }
                                } else if (reference instanceof Object) {
                                    if (reference.hasOwnProperty(p2)) {
                                        inverseExists = true;
                                    }
                                }
                                if (!inverseExists) {
                                    throw new Error(
                                        'The property "' +
                                                property +
                                                '" of the thing "' +
                                                thing +
                                                '" does not refer back to the thing "' +
                                                p2 +
                                                '".'
                                    );
                                }
                            } else {
                                // For things (not types of things, make sure that the thing contains properties
                                // required by its type definition.
                                if (!types[thing]) {
                                    for (p2 in sourceType.properties) {
                                        if (sourceType.properties.hasOwnProperty(p2)) {
                                            if (sourceType.properties[p2].hasOwnProperty('required') && sourceType.properties[p2].required) {
                                                if (!things[thing].hasOwnProperty(p2)) {
                                                    throw new Error(
                                                        'The thing with the ID "' +
                                                            thing +
                                                            '" does not have the required property "' +
                                                            p2 +
                                                            '" defined by the type with the ID "' +
                                                            sourceTypeId +
                                                            "'"
                                                    );
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    logger.info(methodName, 'Finished testing references.');
}

/**
 * Tests that a persistent thing conforms to its type.
 *
 * @param {String} folder       Required folder that contains files that define types of things.
 * @param {String} typeId       Required unique identifier for a type of thing.
 * @param {String} thingId      Required unique identifier for a persistent thing.
 * @param thing                 Required persistent thing.
 * @param checkedProperties     Object whose properties are the identifiers of the given thing's properties that have been checked for conformance to their definitions.
 * @param undefinedProperties   Object whose properties are the identifiers of the given thing's properties that haven't been matched to
 *                              a definition within the thing's type or super-types.
 * @param {boolean} isType      Is the thing to be tested a definition for a type of thing?
 */
function testThing(folder, typeId, thingId, thing, checkedProperties, undefinedProperties, isType) {
    'use strict';
    var collection,
        type,
        typePropertyDefinitions,
        definition,
        hasProperty,
        value,
        valueType,
        i,
        typePath,
        t,
        primitiveType,
        primitive,
        v,
        foundPrimitive,
        thingProperty,
        components,
        superTypeId,
        property,
        properties,
        methodName = 'testThing';
    logger.info(methodName, 'Testing thing "' + thingId + '" against the type "' + typeId + '".');
    if (typeId) {
        type = types[typeId];
        if (type && type.hasOwnProperty('properties')) {
            typePropertyDefinitions = type.properties;
            for (definition in typePropertyDefinitions) {
                if (typePropertyDefinitions.hasOwnProperty(definition)) {
                    if (!checkedProperties.hasOwnProperty(definition)) {
                        checkedProperties[definition] = '';
                        hasProperty = thing.hasOwnProperty(definition);

                        // Test that thing has a value for a required property.
                        if (typePropertyDefinitions[definition].required && (!hasProperty)) {
                            throw new Error(
                                'The thing with the ID "' +
                                    thingId +
                                    '" is missing the required property "' +
                                    definition +
                                    '" defined in the type with the id "' +
                                    typeId +
                                    '".'
                            );
                        }
                        if (undefinedProperties.hasOwnProperty(definition)) {
                            delete undefinedProperties[definition];
                        }
                        if (hasProperty && thing[definition]) {
                            value = thing[definition];
                            valueType = type.properties[definition].type;
                            if (valueType instanceof Array) {
                                if (value instanceof Array) {
                                    if ((typeof valueType[0]) === 'string') {
                                        primitiveType = null;
                                        for (primitive in primitives) {
                                            if (primitives.hasOwnProperty(primitive)) {
                                                if (valueType[0] === primitive) {
                                                    primitiveType = primitives[primitive];
                                                    break;
                                                }
                                            }
                                        }
                                        if (primitiveType) {
                                            for (i = 0; i < value.length; i += 1) {
                                                primitiveType.checkValue(value[i], definition, thingId, folder);
                                            }
                                        } else {
                                            typePath = valueType[0].trim().substring(1, valueType[0].length - 1);
                                            for (i = 0; i < value.length; i += 1) {
                                                if (typeIdOf(value[i]).indexOf(typePath) !== 0) {
                                                    throw new Error(
                                                        'The reference "' +
                                                            value[i] +
                                                            '" at index ' +
                                                            i +
                                                            ' of the property "' +
                                                            definition +
                                                            '" defined in the type with the ID "' +
                                                            typeId +
                                                            '" of the object with the ID "' +
                                                            thingId +
                                                            '" isn\'t compatible with the required type "<' +
                                                            typePath +
                                                            '>".'
                                                    );
                                                }
                                                addReference(thingId, type, definition, value[i]);
                                            }
                                            addCollection(folder, thingId, definition, type.properties[definition], value);
                                        }
                                    } else {
                                        // TODO - If the value is an object, then it is the type definition for
                                        // inline object values.
                                        logger.info(methodName, 'Unimplemented functionality: Value is an object treat as type definition for inline object values.');
                                    }
                                } else {
                                    throw new Error(
                                        'The property "' +
                                            definition +
                                            '" of the thing with the ID "' +
                                            thingId +
                                            '" must be a list of values.'
                                    );
                                }
                            } else if (valueType instanceof Object) {
                                if (value instanceof Array) {
                                    throw new Error(
                                        'The property "' +
                                            definition +
                                            '" of the thing with the ID "' +
                                            thingId +
                                            '" must be a set of unique values.'
                                    );
                                }
                                if (value instanceof Object) {
                                    t = Object.keys(valueType)[0];
                                    if ((typeof t) === 'string') {
                                        primitiveType = null;
                                        for (primitive in primitives) {
                                            if (primitives.hasOwnProperty(primitive)) {
                                                if (t === primitive) {
                                                    primitiveType = primitives[primitive];
                                                    break;
                                                }
                                            }
                                        }
                                        if (primitiveType) {
                                            for (i = 0; i < value.length; i += 1) {
                                                primitiveType.checkValue(value[i], definition, thingId, folder);
                                            }
                                        } else {
                                            typePath = t.trim().substring(1, t.length - 1);
                                            if (value instanceof Array) {
                                                for (i = 0; i < value.length; i += 1) {
                                                    if (typeIdOf(value[i]).indexOf(typePath) !== 0) {
                                                        throw new Error(
                                                            'The reference "' +
                                                                value[i] +
                                                                '" at the index ' +
                                                                i +
                                                                '" of the property "' +
                                                                definition +
                                                                '" defined in the type with the ID "' +
                                                                typeId +
                                                                '" of the object with the ID "' +
                                                                thingId +
                                                                '" isn\'t compatible with the required type "<' +
                                                                typePath +
                                                                '>".'
                                                        );
                                                    }
                                                    addReference(thingId, type, definition, value[i]);
                                                }
                                                addCollection(folder, thingId, definition, type.properties[definition], value);
                                            } else {
                                                collection = [];
                                                for (v in value) {
                                                    if (value.hasOwnProperty(v)) {
                                                        if (typeIdOf(v).indexOf(typePath) !== 0) {
                                                            if (!definedByFacet(type, thingId, definition, v)) {
                                                                throw new Error(
                                                                    'The reference "' +
                                                                        v +
                                                                        '" of the property "' +
                                                                        definition +
                                                                        '" defined in the type with the ID "' +
                                                                        typeId +
                                                                        '" of the object with the ID "' +
                                                                        thingId +
                                                                        '" isn\'t compatible with the required type "<' +
                                                                        typePath +
                                                                        '>".'
                                                                );
                                                            }
                                                        }
                                                        collection.push(v);
                                                        addReference(thingId, type, definition, v);
                                                    }
                                                }
                                                addCollection(folder, thingId, definition, type.properties[definition], collection);
                                            }
                                        }
                                    } else {
                                        // TODO - If the value is an object, then it is the type definition for
                                        // inline object values.
                                        logger.warn(methodName, 'Unimplemented functionality -- Value is an object so treat it as a type definition for inline object values.');
                                    }
                                } else {
                                    throw new Error(
                                        'The property "' +
                                            definition +
                                            '" of the thing with the ID "' +
                                            thingId +
                                            '" must be a set of unique values.'
                                    );
                                }
                            } else {
                                foundPrimitive = false;
                                for (primitive in primitives) {
                                    if (primitives.hasOwnProperty(primitive)) {
                                        if (valueType === primitive) {
                                            primitives[primitive].checkValue(value, definition, thingId, folder);
                                            foundPrimitive = true;
                                            break;
                                        }
                                    }
                                }
                                if (!foundPrimitive) {
                                    if ((typeof value) === 'string') {
                                        v = value.trim();
                                        if (((v.length > 1) && (v[0] === '<') && (v[v.length - 1] === '>'))) {
                                            addReference(thingId, type, definition, v);
                                        }
                                    } else {
                                        throw new Error('The value ' + JSON.stringify(value) + ' cannot be assigned to the property named "' + definition + '", of type "' + valueType + '", defined by the type "' + typeId + '"');
                                    }
                                }
                            }
                        }
                    }
                }
            }
            for (thingProperty in thing) {
                if (thing.hasOwnProperty(thingProperty)) {
                    if ((!checkedProperties.hasOwnProperty(thingProperty)) && (!typePropertyDefinitions.hasOwnProperty(thingProperty))) {
                        undefinedProperties[thingProperty] = '';
                    }
                }
            }
        }
        components = typeId.split('/');
        superTypeId = typeId.split('/').slice(0, components.length - 1).join('/');
        if (isType) {
            if (typeId === '/types') {
                superTypeId = 'types';
            }
        }
        updateAcls(thingId, thing);
        testThing(folder, superTypeId, thingId, thing, checkedProperties, undefinedProperties, isType);
    } else {
        properties = '';
        for (property in undefinedProperties) {
            if (undefinedProperties.hasOwnProperty(property)) {
                properties += property + '\n';
            }
        }
        if (properties.length > 0) {
            throw new Error(
                'The following properties:\n' +
                    properties +
                    'are not defined for the thing with the ID "' +
                    thingId +
                    '", defined in the folder "' +
                    folder +
                    '".'
            );
        }
    }
}

/**
 * Returns the identifier for the type of object named by a given object identifier.
 *
 * @param {String} reference    Required unique ID of a persistent thing.
 * @return {String}             The unique name of a type of thing.
 */
function typeIdOf(reference) {
    'use strict';
    var s = reference.substring(1, reference.length - 1);
    s = s.split('/');
    s = s.slice(0, s.length - 1).join('/');
    return (s.length === 0) ? '/types' : s;
}

/**
 * Updates the given thing's read/write access control lists (ACLs). A thing's access control list specifies which
 * users or groups of users are granted permission to perform an operation on a thing.
 *
 * @param {String} thingId  Required unique ID of persistent thing.
 * @param {Object} thing    Required persistent thing.
 */
function updateAcls(thingId, thing) {
    'use strict';
    var acl;
    if (thing.hasOwnProperty('canRead')) {
        acl = thing.canRead;
        if (acl && (!(acl instanceof Array)) && (acl instanceof Object) && (Object.keys(acl).length > 0)) {
            canReadAcl['<' + thingId + '>'] = acl;
        }
    }
    if (thing.hasOwnProperty('canWrite')) {
        acl = thing.canWrite;
        if (acl && (!(acl instanceof Array)) && (acl instanceof Object) && (Object.keys(acl).length > 0)) {
            canWriteAcl[thingId] = acl;
        }
    }
}

exports.test = test;
/*jslint node: true, stupid: false*/