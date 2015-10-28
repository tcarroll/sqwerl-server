/*globals canRead, console, Exception, externalizeReference, externalizeValue, fetchInversePropertyName, fetchTypeDefinition, fetchTypes, fetchUser, initializeSecurity, inverseFor, isAbsoluteReference, isReference, onSummaryFetched, query, queryResource, require, returnExternalizedObject, returnResourceSummary, summarize, summarizeCollection, summarizeProperties, userIsOwner, userIsAdministrator*/

/**
 * Databases contain persistent objects. Persistent objects have unique identifiers, and contain properties (named
 * values).
 */

/**
 * The name of the web application that provides access to this database's content.
 * @type string
 */
var applicationName = null,

/**
 * Access control lists that specify which users or groups of users can read a thing's properties. The object's
 * properties are the unique ids of things, the values are access control lists. The access control lists' properties
 * are the unique ids of the users or objects granted permission to read a thing's properties.
 *
 * @type {Object}
 */
    canReadAccessControlLists = {
    },

/**
 * Converts data that represents things into JSON.
 */
    converter = require('./converter'),

/**
 * Returns the contents of static files to clients.
 */
    fileServer,

//noinspection JSUnresolvedFunction
/** File system module. **/
    fs = require('fs'),

/**
 * Absolute path to the file system folder that contains this databases' persistent objects.
 * @type {string}
 */
    home,

/*noinspection JSUnresolvedFunction*/
//noinspection JSUnresolvedFunction
/**
 * This class' logger.
 * @type {Logger}
 */
    logger = require('./logger').newInstance('Database'),

//noinspection JSUnresolvedFunction
/**
 * HTTP static file server. Serves files to clients.
 * @type {*}
 */
    nodeStatic = require('../../../node_modules/node-static'),

/**
 * Information necessary for this database to perform a query.
 * @type {*}
 */
    QueryContext = require('./query_context'),

/**
 * Receives a database query's results.
 * @type {*}
 */
    QueryResultsHandler = require('./query_results_handler'),

//noinspection JSUnresolvedFunction
/**
 * Runs a limited number of tasks concurrently.
 * @type {ThrottledWorker}
 */
    throttledWorker = require('./throttled_worker').newInstance(),

/**
 * Name of files that contain a persistent object's properties.
 * @type string
 */
    thingDefinitionFileName = 'thing.json',

/**
 * Name of files that contain metadata that define types of things.
 * @type string
 */
    typeDefinitionFileName = 'type.json';

/**
 * Creates, initializes, and returns a new database of persistent things. This constructor is synchronous.
 *
 * @param {String} applicationName  Required name of the application that is providing access to this database.
 * @param {string} name             Required unique name for this database.
 * @param {Database} parent         Optional parent database. If this database is queried about a thing that it
 *                                  doesn't contain, it forwards the query to its parent database.
 * @param home                      Required absolute path to the file system folder where this database's persistent
 *                                  things are stored.
 * @constructor
 */
function Database(applicationName, name, parent, home) {
    'use strict';
    var message,
        methodName = 'Database';
    logger.info(
        methodName,
        'Creating database named "' + name + '" stored at "' + home + '"' + (parent ? ' with the parent database "' + parent.name + '"' : '') + ' for the application "' + applicationName + '"'
    );
    if (!applicationName) {
        message = 'A non-null, non-empty application name is required.';
        logger.error(methodName, message);
        throw new Error(message);
    }
    if (!name) {
        message = 'Database name must not be null or empty.';
        logger.error(methodName, message);
        throw new Error(message);
    }
    if (!home) {
        message = 'Database path is required.';
        logger.error(methodName, message);
        throw new Error(message);
    }
    this.applicationName = applicationName;
    this.cache = { };
    this.canRead = canRead;
    this.canReadAccessControlLists = { };
////    this.fetchUser = fetchUser;
    this.fileServer = new (nodeStatic.Server)(home, {});
    this.home = home;
    this.name = name;
    this.parent = parent;
    this.query = query;
    this.types = fetchTypes(this, home + '/types', {});
    initializeSecurity(this);
}

/**
 * Sets a result objects 'isType' property if the result object refers to a type of thing.
 *
 * @param {Database} database   Required database.
 * @param {String} resourceId   Required id of thing to return.
 * @param {Object} thing        Required object to add isType property to.
 */
function addIsTypeAttribute(database, resourceId, thing) {
    'use strict';
    if (database.types.hasOwnProperty('</' + database.applicationName + '/' + database.name + resourceId + '>')) {
        thing.isType = true;
    } else if (database.parent) {
        var parent = database.parent;
        if (database.parent.types.hasOwnProperty('</' + parent.applicationName + '/' + parent.name + resourceId + '>')) {
            thing.isType = true;
        }
    }
}

/**
 * Is a user who is performing querying a resource allowed to read the resource's state?
 *
 * @param {Database} database   Required database where the resource is stored.
 * @param {String} resourceId   The resource's required unique identifier.
 * @param {Object} user         Required user requesting to read the resource.
 * @param {String} userId       Required unique identifier of user requesting to read the resource.
 * @return {boolean} true if the querying user is allowed to read a queried resource's state.
 */
function canRead(database, resourceId, user, userId) {
    'use strict';
    var group,
        userCanRead = true;
    if (database.parent) {
        userCanRead = canRead(database.parent, resourceId, user, userId);
    }
    if (userCanRead) {
        // If the database has a read access control list,
        if (database.canReadAccessControlLists.hasOwnProperty(resourceId)) {
            userCanRead = false;
            // The user can read the resource if he or she owns the resource or is an administrator.
            if (userIsOwner(resourceId, user, userId) || userIsAdministrator(user, userId)) {
                userCanRead = true;
            } else {
                // The user can read the resource if he or she has been granted read permission by the thing's
                // read access control list.
                if (database.canReadAccessControlLists.hasOwnProperty(userId)) {
                    userCanRead = true;
                } else {
                    // The user can read the resource if he or she is a member of a group of users who have been
                    // granted read permission on the resource's access control list.
                    if (user.hasOwnProperty('groups')) {
                        for (group in user.groups) {
                            if (user.groups.hasOwnProperty(group)) {
                                if (database.canReadAccessControlLists.hasOwnProperty(group)) {
                                    userCanRead = true;
                                    break;
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    return userCanRead;
}

/**
 * Converts an array of values to an external representation that contains information about the array's members.
 *
 * @param {QueryContext} context                Required query context.
 * @param {string} property                     Required name of the object property whose value is the array to externalize.
 * @param externalization                       Required externalized information that describes the collection.
 * @param {string} value                        Required reference to a thing.
 * @param {QueryResultsHandler} resultsHandler  Required query results handler.
 * @param work                                  Required array whose length indicates number members to externalize.
 * @param {Number} index                        Required index of array member to externalize.
 */
function externalizeArray(context, property, externalization, value, resultsHandler, work, index) {
    'use strict';
    var methodName = 'externalizeArray';
    if (isReference(value)) {
        externalizeReference(context, property, value.substring(1, value.length - 1), QueryResultsHandler.newInstance(
            resultsHandler.resourceNotFound,
            resultsHandler.returnFile,
            function (ctxt) {
                externalization.members[index] = ctxt.result;
                work.pop();
                if (work.length === 0) {
                    context.result = externalization;
                    logger.info(methodName, 'Externalized array of references into: ' + JSON.stringify(externalization));
                    resultsHandler.returnObject(context);
                }
            },
            resultsHandler.userCannotRead
        ));
    } else {
        externalizeValue(context, property, value, QueryResultsHandler.newInstance(
            resultsHandler.resourceNotFound,
            resultsHandler.returnFile,
            function (ctxt) {
                externalization.members[index] = ctxt.result;
                work.pop();
                if (work.length === 0) {
                    context.result = externalization;
                    resultsHandler.returnObject(context);
                }
            },
            resultsHandler.userCannotRead
        ));
    }
}

/**
 * Converts a mapped set of values to an external representation that contains information about the
 * set's contents.
 *
 * @param {QueryContext} context                Required query context.
 * @param {string} property                     Required name of the object property whose value is the hash to externalize.
 * @param externalization                       Required externalized information that describes the mapped set.
 * @param value                                 Required reference to a thing.
 * @param {QueryResultsHandler} resultsHandler  Required query results handler.
 * @param work                                  Required array whose length indicates number of members in the set to
 *                                              externalize.
 * @param queue                                 List hash members to externalize.
 */
function externalizeHash(context, property, externalization, value, resultsHandler, work, queue) {
    'use strict';
    var index;
    if (isReference(value)) {
        externalizeReference(context, property, value ? value.substring(1, value.length - 1) : '', QueryResultsHandler.newInstance(
            function resourceNotFound() {
                externalization.members.push({ id: value });
                returnExternalizedObject(work, context, externalization, resultsHandler);
            },
            resultsHandler.returnFile,
            function returnObject(innerContext) {
                index = work.indexOf('<' + innerContext.result.id + '>');
                externalization.members[index] = innerContext.result;
                queue.pop();
                returnExternalizedObject(queue.length, context, externalization, resultsHandler);
            },
            resultsHandler.userCannotRead
        ));
    } else {
        externalizeValue(context, property, value, QueryResultsHandler.newInstance(
            resultsHandler.resourceNotFound,
            resultsHandler.returnFile,
            function (innerContext) {
                externalization.members[0] = innerContext.result;
                count -= 1;
                returnExternalizedObject(count, context, externalization, resultsHandler);
            },
            resultsHandler.userCannotRead
        ));
    }
}

/**
 * Converts a reference to a thing into an externalized representation that summarizes the referenced thing.
 *
 * @param {QueryContext} context                Required query context.
 * @param {String} property                     Required name of the object property whose value is the reference to externalize.
 * @param {String} reference                    Required reference to a thing.
 * @param {QueryResultsHandler} resultsHandler  Required query results handler.
 */
function externalizeReference(context, property, reference, resultsHandler) {
    'use strict';
    var methodName = 'externalizeReference';
    context.externalizeReferences = false;
    queryResource(
        context,
        property,
        reference,
        QueryResultsHandler.newInstance(
            resultsHandler.resourceNotFound,
            resultsHandler.returnFile,
            function (ctxt) {
                var count,
                    externalization = { },
                    inversePropertyName,
                    references;
                externalization.href = ctxt.createHref();
                externalization.id = reference;
                externalization.name = ctxt.result.name;
                externalization.path = ctxt.result.path;
                if (ctxt.property) {
                    inversePropertyName = fetchInversePropertyName(ctxt.database, reference, property);
                    if (inversePropertyName && ctxt.result.hasOwnProperty(inversePropertyName)) {
                        references = ctxt.result[inversePropertyName];
                        count = Object.keys(references).length;
                        externalization[inversePropertyName + 'Count'] = count;
                    }
                }
                logger.info(methodName, 'Externalized the reference "' + reference + '"');
                ctxt.result = externalization;
                resultsHandler.returnObject(ctxt);
            },
            resultsHandler.userCannotRead
        )
    );
}

/**
 * Converts the given query results object into an object returned to remote clients. For example, references to
 * things are converted into object that summarize the referenced object and collections of things are converted
 * into summaries that describe the collections.
 *
 * @param {QueryContext} context                Required query parameters.
 * @param {string} property                     Required name of the object property whose value are the externalized references.
 * @param result                                Required query result to externalize.
 * @param {QueryResultsHandler} resultsHandler  Required object to return query results to.
 */
function externalizeReferences(context, property, result, resultsHandler) {
    'use strict';
    var collectionLimit = 10,
        count,
        i,
        id,
        methodName = 'externalizeReferences',
        newContext,
        p2,
        record,
        totalCount,
        work;
    logger.info(methodName, 'Externalizing references within the internal query result: ' + result);
    if (typeof result === 'string') {
        id = result.trim();
        if (isReference(id)) {
            logger.info(methodName, 'Externalizing reference: ' + id);
            record = { };
            record.href = context.createHref();
            record.id = id.substring(1, id.length);
            newContext = QueryContext.newInstance(context.configuration, resultsHandler, context.request, context.response, context.database, record.id, context.userId, false, false);
            queryResource(
                newContext,
                record.id,
                QueryResultsHandler.newInstance(
                    resultsHandler.resourceNotFound,
                    resultsHandler.returnFile,
                    function (context) {
                        var outcome = context.result;
                        if (outcome && (outcome.hasOwnProperty('name'))) {
                            record.name = outcome.name;
                        }
                        resultsHandler.returnObject(record);
                    },
                    resultsHandler.userCannotRead
                )
            );
        } else {
            resultsHandler.returnObject(result);
        }
    } else if (result instanceof Array) {
        count = Math.min(collectionLimit, result.length);
        record = {};
        record.members = [];
        record.limit = collectionLimit;
        record.offset = 0;
        record.totalCount = result.length;
        work = [];
        for (i = 0; i <= count; i += 1) {
            work.push(function (next) {
                this.externalizeReferences(
                    context,
                    property,
                    result[i],
                    QueryResultsHandler.newInstance(
                        resultsHandler.resourceNotFound,
                        resultsHandler.returnFile,
                        function (object) {
                            next(object);
                        },
                        resultsHandler.userCannotRead
                    )
                );
            });
        }
        throttledWorker.doWork(
            work,
            function (members) {
                members.forEach(function (member) {
                    record.members.push(member[0]);
                });
                context.result = record;
                resultsHandler.returnObject(context);
            },
            collectionLimit
        );
    } else if (result instanceof Object) {
        count = 0;
        record = {};
        totalCount = 0;
        work = [];
        for (property in result) {
            if (result.hasOwnProperty(property)) {
                id = property.trim();
                if (isReference(id)) {
                    count += 1;
                    if (count <= collectionLimit) {
                        work.push(function (next) {
                            context.result = id;
                            externalizeReferences(
                                context,
                                property,
                                id,
                                QueryResultsHandler.newInstance(
                                    resultsHandler.resourceNotFound,
                                    resultsHandler.returnFile,
                                    function (object) {
                                        context.result = result;
                                        record.members.push(object);
                                    },
                                    resultsHandler.userCannotRead
                                )
                            );
                            next(null);
                        });
                    }
                    if (canRead(context.database, id, context.user, context.userId)) {
                        totalCount += 1;
                    }
                } else {
                    p2 = property;
                    work.push(function (next) {
                        var handler = QueryResultsHandler.newInstance(
                            resultsHandler.resourceNotFound,
                            resultsHandler.returnFile,
                            function (c) {
                                record[p2] = c.result;
                                next(record);
                            },
                            resultsHandler.userCannotRead
                        );
                        handler.result = record;
                        externalizeReferences(context, property, record[p2], handler);
                    });
                }
            }
        }
        if (count > 0) {
            record.limit = collectionLimit;
            record.members = [];
            record.offset = 0;
            record.totalCount = totalCount;
        }
        throttledWorker.doWork(
            work,
            function () {
                console.log(JSON.stringify(record));
                resultsHandler.returnObject(record);
            },
            collectionLimit
        );
    } else {
        resultsHandler.returnObject(context);
    }
}

/**
 * Converts a thing's values that are references to things or collections of references to things into externalized
 * values that summarize the referenced things or collections of referenced things.
 *
 * @param {QueryContext} context                Required query context.
 * @param thing                                 Required thing whose properties will be externalized.
 * @param {String} resourceId                   Required unique identifier of the thing to externalize.
 * @param {QueryResultsHandler} resultsHandler  Required query results handler.
 */
function externalizeThing(context, thing, resourceId, resultsHandler) {
    'use strict';
    var count = 0,
        methodName = 'externalizeThing',
        p,
        properties = [];
    for (p in thing) {
        if (thing.hasOwnProperty(p)) {
            properties.push(p);
            count += 1;
        }
    }
    context.propertyCount = count;
    properties.forEach(function (property) {
        logger.info(methodName, 'Externalizing value of property named: ' + property);
        externalizeValue(context, property, thing[property], QueryResultsHandler.newInstance(
            resultsHandler.resourceNotFound,
            function (ctxt, value) {
                thing[property] = ctxt.applicationName + '/' + ctxt.database.name + ctxt.resourceId + '/' + value.slice(1, value.length - 1);
                logger.info(methodName, 'Set the property \'' + property + '\'' + 'to the externalized value: ' + JSON.stringify(thing[property]));
                count -= 1;
                if (count === 0) {
                    ctxt.result = thing;
                    resultsHandler.returnObject(ctxt);
                }
            },
            function (ctxt) {
                var externalizedValue = ctxt.result;
                thing[property] = externalizedValue;
                logger.info(methodName, 'Set the property \'' + property + '\' to the externalized value: ' + JSON.stringify(externalizedValue));
                count -= 1;
                if (count === 0) {
                    ctxt.result = thing;
                    ctxt.resourceId = resourceId;
                    resultsHandler.returnObject(ctxt);
                }
            },
            resultsHandler.userCannotRead
        ));
    });
}

/**
 * Converts the given value of a thing's property into an externalized value that may be a summary of the actual
 * value.
 *
 * @param {QueryContext} context                Required query context.
 * @param {string} property                     Required name of the object property to assign the externalized value to.
 * @param value                                 Required value of a thing's property.
 * @param {QueryResultsHandler} resultsHandler  Required query results handler.
 */
function externalizeValue(context, property, value, resultsHandler) {
    'use strict';
    var collectionLimit = 10,
        count,
        i,
        id,
        p,
        properties = [],
        queue,
        record,
        work = [];
    if (typeof value === 'string') {
        id = value.trim();
        if (isReference(id)) {
            if (isAbsoluteReference(id)) {
                externalizeReference(context, property, value.substring(1, value.length - 1), resultsHandler);
            } else {
                resultsHandler.returnFile(context, value);
            }
        } else {
            context.result = value;
            resultsHandler.returnObject(context);
        }
    } else if (value instanceof Array) {
        count = value.length;
        record = {};
        record.limit = collectionLimit;
        record.members = [];
        record.offset = 0;
        record.totalCount = value.length;
        if (count === 0) {
            context.result = record;
            resultsHandler.returnObject(context);
        } else {
            for (i = 0; i < count; i += 1) {
                if (canRead(context.database, value[i], context.user, context.userId)) {
                    work.push(value[i]);
                } else {
                    record.totalCount -= 1;
                }
            }
            count = work.length;
            for (i = 0; i < count; i += 1) {
                externalizeArray(context, property, record, work[i], resultsHandler, work, i);
            }
        }
    } else if (value instanceof Object) {
        record = {
            limit: collectionLimit,
            offset: 0,
            totalCount: 0
        };
        count = 0;
        for (p in value) {
            if (value.hasOwnProperty(p) && isReference(p)) {
                count += 1;
                properties.push(p);
                record.totalCount += 1;
            }
        }
        if (count === 0) {
            context.result = record;
            resultsHandler.returnObject(context);
        } else {
            record.members = [];
            for (i = 0; i < count; i += 1) {
                p = properties.pop();
                if (canRead(context.database, p, context.user, context.userId)) {
                    work.unshift(p);
                } else {
                    record.totalCount -= 1;
                }
            }
            count = Math.min(work.length, record.limit);
            if (count === 0) {
                context.result = record;
                resultsHandler.returnObject(context);
            } else {
                work = work.slice(0, count);
                queue = work.slice();
                for (i = 0; i < count; i += 1) {
                    externalizeHash(context, property, record, work[i], resultsHandler, work, queue);
                }
            }
        }
    } else {
        context.result = value;
        resultsHandler.returnObject(context);
    }
}

/**
 *
 * @param database      Required database.
 * @param id            Required unique identifier for a thing.
 * @param property      Required name of a thing's property.
 * @returns {String}    The name of the inverse property of a related thing.
 */
function fetchInversePropertyName(database, id, property) {
    'use strict';
    var facet,
        inversePropertyName,
        typeId = id.split('/').slice(0, 3).join('/'),
        typeDefinition = fetchTypeDefinition(database, typeId);
    inversePropertyName = inverseFor(typeDefinition, property);
    if ((!inversePropertyName) && typeDefinition && typeDefinition.hasOwnProperty('facets')) {
        for (facet in typeDefinition.facets) {
            if (typeDefinition.facets.hasOwnProperty(facet)) {
                inversePropertyName = inverseFor(fetchTypeDefinition(database, facet), property);
                if (inversePropertyName) {
                    break;
                }
            }
        }
    }
    return inversePropertyName;
}

/**
 * Fetches a resource's summarized description.
 *
 * @param {QueryContext} context    Required query context.
 * @param {Array} [properties]      Optional names of properties whose values should be summarized.
 * @param {String} resourceId       Required name of the resource to summarize.
 * @param {Function} next           Function to invoke to return a resource's summary.
 */
function fetchSummary(context, properties, resourceId, next) {
    'use strict';
    var database = context.database,
        fileName,
        methodName = 'fetchSummary',
        resourcePath = database.home + resourceId,
        summary = { };
    logger.info(methodName, 'Fetching summary for "' + resourceId + '"');
    fs.stat(resourcePath, function (error, status) {
        if (error) {
            if (database.parent) {
                context.database = database.parent;
                fetchSummary(context, properties, resourceId, next);
                context.database = database;
            } else {
                context.resultsHandler.resourceNotFound(context, error);
            }
        } else {
            if (status.isDirectory()) {
                fileName = resourcePath + '/' + thingDefinitionFileName;
                if (database.cache.hasOwnProperty(fileName)) {
                    onSummaryFetched(
                        database.cache[fileName],
                        {
                            context: context,
                            database: database,
                            resourceId: resourceId,
                            properties: properties,
                            fileName: fileName,
                            summary: summary,
                            next: next
                        }
                    );
                } else {
                    if (context.fileReadRequests.hasOwnProperty(fileName)) {
                        if (!context.fileReadRequests[fileName]) {
                            context.fileReadRequests[fileName] = [];
                        }
                        context.fileReadRequests[fileName].push({
                            callback: onSummaryFetched,
                            context: context,
                            database: database,
                            resourceId: resourceId,
                            properties: properties,
                            fileName: fileName,
                            summary: summary,
                            next: next
                        });
                    } else {
                        fs.stat(fileName, function (error2) {
                            if (error2) {
                                if (database.parent) {
                                    context.database = database.parent;
                                    fetchSummary(context, properties, resourceId, next);
                                    context.database = database;
                                } else {
                                    context.resultsHandler.resourceNotFound(context, error2);
                                }
                            } else {
                                if (!context.fileReadRequests[fileName]) {
                                    context.fileReadRequests[fileName] = [ ];
                                }
                                context.fileReadRequests[fileName].push({
                                    callback: onSummaryFetched,
                                    context: context,
                                    database: database,
                                    resourceId: resourceId,
                                    properties: properties,
                                    fileName: fileName,
                                    summary: summary,
                                    next: next
                                });
                                fs.readFile(fileName, function (error3, data) {
                                    var requests = context.fileReadRequests;
                                    if (error3) {
                                        context.resultsHandler.resourceNotFound(context, error3);
                                    } else {
                                        logger.info(methodName, 'Read file "' + fileName + '"');
                                        database.cache[fileName] = data;
                                        if (requests.hasOwnProperty(fileName)) {
                                            requests[fileName].forEach(function (p) {
                                                p.callback(data, p);
                                            });
                                        }
                                    }
                                });
                            }
                        });
                    }
                }
            } else {
                context.resultsHandler.returnFile(context, resourcePath);
            }
        }
    });
    context.isSummaryQuery = true;
}

/**
 * Returns a thing that defines a type of things.
 *
 * @param database      Required database that contains thing definitions.
 * @param typeId        Required the unique identifier for a type of thing.
 * @returns {*|String}  A thing that defines a type of thing: properties common to things of the same type.
 */
function fetchTypeDefinition(database, typeId) {
    'use strict';
    var typeDefinition = database.types['</' + database.applicationName + '/' + database.name + typeId + '>'];
    if ((!typeDefinition) && database.parent) {
        typeDefinition = fetchTypeDefinition(database.parent, typeId);
    }
    return typeDefinition;
}

/**
 * Returns the types of things that the given database can contain.
 *
 * @param {Database} database   A required database
 * @return {Object} A non-null object whose properties are references to types of things that can be stored in the given database.
 */
function fetchTypes(database) {
    'use strict';
    var databaseTypesFolderName = database.home + '/types',
        methodName = 'fetchTypes',
        databaseDefinition,
        type,
        types = {},
        typesFile = databaseTypesFolderName + '/' + typeDefinitionFileName;
    /*jslint node: true, stupid: true */
    if (fs.existsSync(typesFile)) {
        logger.info(methodName, 'Reading database types file "' + typesFile + '"');
        databaseDefinition = converter.asObject(database, databaseTypesFolderName, fs.readFileSync(typesFile));
        if (databaseDefinition && databaseDefinition.hasOwnProperty('children')) {
            types = databaseDefinition.children;
            for (type in types) {
                if (types.hasOwnProperty(type)) {
                    types[type] = JSON.parse(fs.readFileSync(database.home + '/' + type.slice(1, type.length - 1).split('/').slice(3).join('/') + '/' + typeDefinitionFileName));
                }
            }
        }
        logger.info(methodName, 'For database "' + database.name + '" retrieved types: "' + converter.asJson(types) + '"');
    } else {
        logger.info(methodName, 'The database "' + database.name + '" does not define any new types of things.');
    }
    /*jslint node: true, stupid: false */
    return types;
}

function fetchTypes(database, folderName, types) {
    'use strict';
    var child,
        children,
        databaseDefinition,
        files = fs.readdirSync(folderName),
        methodName = 'fetchTypes',
        stats,
        typeFileName;
    files.forEach(function (fileName) {
        if (fileName === typeDefinitionFileName) {
            typeFileName = folderName + '/' + fileName;
            logger.info(methodName, 'Reading thing type definition file "' + typeFileName + '"');
            databaseDefinition = converter.asObject(database, folderName, fs.readFileSync(typeFileName));
            if (databaseDefinition && databaseDefinition.hasOwnProperty('children')) {
                children = databaseDefinition.children;
                Object.keys(children).forEach(function (child) {
                    types[child] = JSON.parse(fs.readFileSync(database.home + '/' + child.slice(1, child.length - 1).split('/').slice(3).join('/') + '/' + typeDefinitionFileName));
                });
            }
        } else if (fileName.slice(0, 1) !== '.') {
            stats = fs.statSync(folderName + '/' + fileName);
            if (stats.isDirectory()) {
                fetchTypes(database, folderName + '/' + fileName, types);
            }
        }
    });
    return types;
}

/**
 * Returns information about a user and stores it in the given query context.
 *
 * @param {QueryContext} context    Required query parameters.
 * @param {function} callback       Required callback to invoke once user information is retrieved.
 */
function fetchUser(context, callback) {
    'use strict';
    var methodName = 'fetchUser',
        newContext =
            QueryContext.newInstance(
                context.configuration,
                QueryResultsHandler.newInstance(
                    function resourceNotFound(context2) {
                        throw new Error('Could not find the user "' + context2.resourceId + '"');
                    },

                    null, /* returnFileCallback */

                    function returnObject(context2) {
                        context.user = context2.result;
                        logger.info(methodName, 'Retrieved user "' + converter.asJson(context.user) + '"');
                        if (callback) {
                            callback();
                        }
                    },

                    null /* userCannotReadCallback */
                ),
                context.request,
                context.response,
                context.database,
                context.userId,
                '/types/users/Administrator',
                false,
                false
            );
    newContext.externalizeReferences = false;
    logger.info(methodName, 'Fetching user "' + context.userId + '"');
    queryResource(newContext, null, context.userId, newContext.resultsHandler);
}

/**
 * Synchronously reads security information that states which users can read which persistent things.
 *
 * @param {Database} database   A required database that contains security information.
 */
function initializeSecurity(database) {
    'use strict';
    var methodName = 'initializeSecurity';
    logger.info(methodName, 'Initializing security');
    /*jslint node: true, stupid: true */
    database.canReadAccessControlLists = JSON.parse(fs.readFileSync(database.home + '/read_acls.json'));
    /*jslint node: true, stupid: false */
    logger.info(methodName, 'Finished initializing security');
}

/**
 *
 * @param typeDefinition    Required thing that defines a type of thing.
 * @param property          Name of a property common to things of the type defined by the given type definition.
 * @returns {*|String}      The name of the given property's inverse property: the name of a corresponding property
 *                          whose value is related to values with the given property name.
 */
function inverseFor(typeDefinition, property) {
    'use strict';
    var inversePropertyName,
        p,
        propertyDefinition;
    if (typeDefinition && typeDefinition.hasOwnProperty('properties')) {
        for (p in typeDefinition.properties) {
            if (typeDefinition.properties.hasOwnProperty(p)) {
                propertyDefinition = typeDefinition.properties[p];
                if (propertyDefinition.hasOwnProperty('inverse') && (property === propertyDefinition.inverse)) {
                    inversePropertyName = p;
                    break;
                }
            }
        }
    }
    return inversePropertyName;
}

/**
 * Is the given text string an absolute reference to a thing? An absolute reference refers to a thing by a path
 * from the root of a hierarchy of things.
 *
 * @param {string} text  Required text string.
 * @returns {isReference|boolean} True if the given string is an absolute, and not a relative, reference.
 */
function isAbsoluteReference(text) {
    'use strict';
    return isReference && (text.charAt(1) === '/');
}

/**
 * Is the given text string a reference to a thing?
 *
 * @param {string} text     Required text string.
 * @returns {boolean}       True if the given string refers to a thing.
 */
function isReference(text) {
    'use strict';
    return (text.charAt(0) === '<') && (text.charAt(text.length - 1) === '>');
}

/**
 * Creates, and returns, a new database.
 *
 * @param {string} applicationName  Required, non-null, non-empty name of the application that provides access to the database.
 * @param {string} name             Required, non-null, non-empty name for the database.
 * @param {Database} [parent]       Optional parent database.
 * @param {String} home             Required, non-null, non-empty path to the directory where the database's data are stored.
 * @return {Database} A new, non-null database object.
 */
function newInstance(applicationName, name, parent, home) {
    'use strict';
    return new Database(applicationName, name, parent, home);
}

function onResourceFetched(data, property, resourceId, parameters) {
    'use strict';
    var context = parameters.context,
        database = parameters.database,
        fileName = parameters.fileName,
        methodName = 'onResourceFetched',
        resultsHandler = parameters.resultsHandler;
    context.resourceId = resourceId;
    data = database.cache[fileName];
    context.result = JSON.parse(data);
    if (context.isSummaryQuery) {
        returnResourceSummary(context);
    } else {
        addIsTypeAttribute(database, resourceId, context.result);
        if (context.externalizeReferences) {
            logger.info(methodName, 'Externalizing values for ' + fileName);
            externalizeThing(context, context.result, resourceId, resultsHandler);
        } else {
            context.property = property;
            resultsHandler.returnObject(context);
        }
    }
}

function onSummaryFetched(data, parameters) {
    'use strict';
    var context = parameters.context,
        database = parameters.database,
        fileName = parameters.fileName,
        methodName = 'onSummaryFetched',
        properties = parameters.properties,
        resourceId = parameters.resourceId,
        summary = parameters.summary,
        thing;
    logger.info(methodName, 'Contents of file "' + fileName + '" retrieved');
    thing = converter.asObject(database, resourceId, data);
    summary.id = resourceId;
    summary.name = thing.name;
    summary.path = thing.path;
    summary.shortDescription = (thing.shortDescription || thing.description || '');
    summary.isSummary = true;
    if (properties) {
        summarizeProperties(context, properties, thing, summary);
    }
    parameters.next(summary);
}

/**
 * Queries a database of persistent things.
 *
 * @param {QueryContext} context  Required query parameters.
 */
function query(context) {
    'use strict';
    var database = context.database,
        databaseName = database.name,
        methodName = 'query',
        resourceId = context.resourceId;
    logger.info(methodName, 'Querying node with ID: "' + resourceId + '" from database "' + databaseName + '"');
    fetchUser(context, function () {
        if (database.canRead(context.database, context.resourceId, context.user, context.userId)) {
            queryResource(context, null, resourceId, context.resultsHandler);
        } else {
            context.resultsHandler.userCannotRead(context);
        }
    });
}

/**
 * Queries a resource that corresponds to a persistent thing.
 *
 * @param {QueryContext} context                Required query parameters.
 * @param {String} property
 * @param {String} resourceId                   Required unique resource identifier.
 * @param {QueryResultsHandler} resultsHandler  Required object to return query results to.
 */
function queryResource(context, property, resourceId, resultsHandler) {
    'use strict';
    var database = context.database,
        methodName = 'queryResource',
        resourcePath = database.home + resourceId,
        fileName,
        isMetadataQuery = context.isMetadataQuery;
    logger.info(methodName, 'Querying resource "' + resourceId + '" at path "' + resourcePath + '" for user "' + context.userId + '" in database "' + context.database.name + '"');
    fs.stat(resourcePath, function (error, status) {
        if (error) {
            if (database.parent) {
                context.database = database.parent;
                queryResource(context, property, resourceId, resultsHandler);
                context.database = database;
            } else {
                resultsHandler.resourceNotFound(context, error);
            }
        } else {
            if (status.isDirectory()) {
                fileName = resourcePath + '/' + (isMetadataQuery ? typeDefinitionFileName : thingDefinitionFileName);
                fs.stat(fileName, function (error2) {
                    if (error2) {
                        if (database.parent) {
                            context.database = database.parent;
                            queryResource(context, property, resourceId, resultsHandler);
                            context.database = database;
                        } else {
                            resultsHandler.resourceNotFound(context, error2);
                        }
                    } else {
                        if (database.cache.hasOwnProperty(fileName)) {
                            onResourceFetched(
                                database.cache[fileName],
                                property,
                                resourceId,
                                {
                                    context: context,
                                    database: database,
                                    fileName: fileName,
                                    resourceId: resourceId,
                                    resultsHandler: resultsHandler
                                }
                            );
                        } else {
                            if (context.fileReadRequests.hasOwnProperty(fileName)) {
                                if (!context.fileReadRequests[fileName]) {
                                    context.fileReadRequests[fileName] = [];
                                }
                                context.fileReadRequests[fileName].push({
                                    callback: onResourceFetched,
                                    context: context,
                                    database: database,
                                    fileName: fileName,
                                    resourceId: resourceId,
                                    resultsHandler: resultsHandler
                                });
                            } else {
                                if (!context.fileReadRequests[fileName]) {
                                    context.fileReadRequests[fileName] = [];
                                }
                                context.fileReadRequests[fileName].push({
                                    callback: onResourceFetched,
                                    context: context,
                                    database: database,
                                    fileName: fileName,
                                    resourceId: resourceId,
                                    resultsHandler: resultsHandler
                                });
                                fs.readFile(fileName, function (error3, data) {
                                    var requests = context.fileReadRequests;
                                    if (error3) {
                                        resultsHandler.resourceNotFound(context, error3);
                                    } else {
                                        logger.info(methodName, 'Read file "' + fileName + '"');
                                        database.cache[fileName] = data;
                                        if (requests.hasOwnProperty(fileName)) {
                                            requests[fileName].forEach(function (p) {
                                                p.callback(data, property, p.resourceId, p);
                                            });
                                        }
                                    }
                                });
                            }
                        }
                    }
                });
            } else {
                logger.info(methodName, 'Returning file at \'' + database.home + resourceId + '\'');
                context.request.url = resourceId;
                resultsHandler.returnFile(context, database.home + resourceId);
            }
        }
    });
}

function returnExternalizedObject(count, context, externalization, resultsHandler) {
    'use strict';
    if (count === 0) {
        context.result = externalization;
        resultsHandler.returnObject(context);
    }
}

/**
 * Returns to a query submitter summarized information about one of this database's resources.
 *
 * @param {QueryContext} context   Required query context.
 */
function returnResourceSummary(context) {
    'use strict';
    var database = context.database,
        i = 0,
        ids,
        limit = 10,
        methodName = 'returnResourceSummary',
        offset = 0,
        properties,
        propertiesList,
        queryParameters = context.queryParameters,
        result = context.result,
        resourcesToSummarize = { },
        temp;
    logger.info(methodName, 'Returning summary of "' + context.resourceId + '"');
    // If asked to summarize the value of a thing's properties (the properties are specified in a comma-separated list)
    if (queryParameters && queryParameters.hasOwnProperty('properties')) {
        propertiesList = queryParameters.properties;
        if (propertiesList) {
            properties = propertiesList.split(',');
            properties.forEach(function (property) {
                var resource;
                logger.info(methodName, 'Summarizing property "' + property + '" of "' + context.resourceId + '"');
                resourcesToSummarize[property] = {};
                resourcesToSummarize[property].totalCount = 0;
                resourcesToSummarize[property].ids = [];
                resourcesToSummarize.path = context.result.path;
                if (context.result.hasOwnProperty(property)) {
                    if (result.hasOwnProperty(property)) {
                        if (result[property] instanceof Array) {
                            result[property].forEach(function (resource) {
                                if (database.canRead(context.database, resource, context.user, context.userId)) {
                                    resourcesToSummarize[property].totalCount += 1;
                                    resourcesToSummarize[property].ids.push(converter.stripReferenceMarks(resource));
                                }
                            });
                        } else {
                            for (resource in result[property]) {
                                if (result[property].hasOwnProperty(resource)) {
                                    if (database.canRead(context.database, resource, context.user, context.userId)) {
                                        resourcesToSummarize[property].totalCount += 1;
                                        resourcesToSummarize[property].ids.push(converter.stripReferenceMarks(resource));
                                    }
                                }
                            }
                        }
                    }
                }
            });
            properties.forEach(function (property) {
                if (resourcesToSummarize.hasOwnProperty(property)) {
                    if (context.queryParameters.hasOwnProperty('offset')) {
                        temp = parseInt(context.queryParameters.offset, limit);
                        if (temp && (temp > 0)) {
                            offset = temp;
                        }
                    }
                    resourcesToSummarize[property].offset = offset;
                    if (context.queryParameters.hasOwnProperty('limit')) {
                        temp = parseInt(context.queryParameters.limit, limit);
                        if (temp && (temp > 0)) {
                            limit = temp;
                        }
                    }
                    resourcesToSummarize[property].limit = limit;
                    ids = resourcesToSummarize[property].ids;
                    ids = ids.slice(offset, Math.min(ids.length, offset + limit));
                    summarizeCollection(context, properties, ids, function (summaries) {
                        var members = [];
                        delete resourcesToSummarize[property].ids;
                        summaries.forEach(function (summary) {
                            addIsTypeAttribute(database, summary[0].id, summary[0]);
                            members.push(summary[0]);
                        });
                        resourcesToSummarize[property].members = members;
                        i += 1;
                        if (i === properties.length) {
                            context.result = resourcesToSummarize;
                            addIsTypeAttribute(database, context.resourceId, context.result);
                            context.resultsHandler.returnObject(context);
                        }
                    });
                }
            });
        } else {
            summarize(context);
        }
    } else {
        summarize(context);
    }
}

/**
 * Returns the contents of a file to the client.
 *
 * @param {Database} database   Required database that contains the file.
 * @param {Request} request     Required client request for a file.
 * @param response              Required response to client.
 */
function serveFile(database, request, response) {
    'use strict';
    var methodName = 'serveFile';
    database.fileServer.serve(request, response, function (error) {
        if (error) {
            logger.info(methodName, 'Error returning file "' + request.url + '".');
            logger.info(methodName, 'Error: "' + error.message + '"');
            response.writeHead(error.status, error.headers);
            response.end();
        }
    });
}

/**
 * Summarizes a persistent thing's state by replacing the thing's properties whose values are collections (vectors)
 * with scalar properties whose values are the size of the collections. For example, if the given thing has a
 * property called 'children' which is an object whose properties are the unique IDs of the thing's children, this
 * method will return a version of the given thing, without a 'children' property, but with a 'childrenCount'
 * property whose value is the number of properties (children) of the thing's 'children' property.
 *
 * @param {QueryContext} context    Required query context.
 */
function summarize(context) {
    'use strict';
    var countPropertyName,
        property,
        summary = { },
        thing = context.result;
    if (thing) {
        for (property in thing) {
            if (thing.hasOwnProperty(property)) {
                countPropertyName = property + 'Count';
                if (thing[property] instanceof Array) {
                    summary[countPropertyName] = thing[property].length;
                } else if (thing[property] instanceof Object) {
                    summary[countPropertyName] = Object.keys(thing[property]).length;
                } else {
                    summary[property] = thing[property];
                }
            }
        }
    }
    context.result = summary;
    addIsTypeAttribute(context.database, context.resourceId, context.result);
    context.resultsHandler.returnObject(context);
}

/**
 * Returns summaries that describe things within a collection.
 *
 * @param {QueryContext} context    Required query context.
 * @param {Array} [properties]      Optional name of properties whose values should be summarized.
 * @param {Array} ids               Required array of the unique IDs of things to summarize.
 *
 * @param {Function} callback       Required callback function passed collection of summaries.
 */
function summarizeCollection(context, properties, ids, callback) {
    'use strict';
    var summaries = { },
        work = [ ];
    ids.forEach(function (id) {
        if (context.database.canRead(context.database, id, context.user, context.userId)) {
            work.push(function (next) {
                fetchSummary(context, properties, id, next);
            });
        }
    });
    if (work) {
        throttledWorker.doWork(work, function (summaries) {
            callback(summaries);
        });
    } else {
        callback(summaries);
    }
}

/**
 * Summarizes properties of a thing where the properties' values are collections. A collection value is summarized
 * by the number of items in the collection.
 *
 * @param {QueryContext} context    Required database query context.
 * @param {Array} properties        Required names of properties to summarize.
 * @param thing                     Required persistent thing to summarize.
 * @param summary                   Required summary of the given persistent thing.
 */
function summarizeProperties(context, properties, thing, summary) {
    'use strict';
    var count,
        countPropertyName,
        database = context.database;
    properties.forEach(function (property) {
        var ref;
        if (thing.hasOwnProperty(property)) {
            countPropertyName = property + 'Count';
            if (thing[property] instanceof Array) {
                count = thing[property].length;
                thing[property].forEach(function (id) {
                    if (!database.canRead(database, decodeURI(converter.stripApplicationAndDatabase(id)), context.user, context.userId)) {
                        count -= 1;
                    }
                });
                summary[countPropertyName] = count;
            } else if (thing[property] instanceof Object) {
                count = Object.keys(thing[property]).length;
                for (ref in thing[property]) {
                    if (thing[property].hasOwnProperty(ref)) {
                        if (!database.canRead(database, decodeURI(converter.stripApplicationAndDatabase(ref)), context.user, context.userId)) {
                            count -= 1;
                        }
                    }
                }
                summary[countPropertyName] = count;
            }
        }
    });
}

/**
 * Is the user performing a query an Administrator?
 *
 * @param {Object} user         Required user.
 * @param {String} userId       Required user's unique identifier.
 * @return {boolean} true if then given user is an administrator.
 */
function userIsAdministrator(user, userId) {
    'use strict';
    var isAdministrator,
        methodName = 'userIsAdministrator';
    isAdministrator = user.groups.hasOwnProperty('/types/groups/Administrators');
    logger.info(methodName, 'The user "' + userId + '" ' + (isAdministrator ? 'is an administrator' : 'isn\'t an administrator'));
    return isAdministrator;
}

/**
 * Does a user own a resource?
 *
 * @param {String} resourceId   Required resource's unique identifier.
 * @param {Object} user         Required user.
 * @param {String} userId       Required user's unique identifier.
 * @return {boolean} true if the given user owns the given resource.
 */
function userIsOwner(resourceId, user, userId) {
    'use strict';
    var isOwner = false,
        methodName = 'userIsOwner';
    if (user.hasOwnProperty('owns')) {
        isOwner = user.owns.hasOwnProperty(resourceId);
    }
    logger.info(methodName, 'The user "' + userId + '" ' + (isOwner ? 'owns' : 'does not own') + ' the resource "' + resourceId + '"');
    return isOwner;
}

exports.newInstance = newInstance;
exports.query = query;