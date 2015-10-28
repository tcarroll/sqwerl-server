/*globals exports, isNotHidden, loadFile, require, search*/

/**
 * Searches things.
 */
var fs = require('fs'),

    logger = require('./logger').newInstance('Search'),

    lunr = require('lunr'),

    worker = require('./throttled_worker').newInstance();

/**
 * Adds, and returns, a search result to the given collection of search results.
 *
 * @param searcher          A search index.
 * @param searchResults     A collection of results from a search performed by the given searcher.
 * @param result            A search result.
 * @returns {object}        A new search result added to the given collection of search results.
 */
function addSearchResult(searcher, searchResults, result) {
    'use strict';
    var searchResult;
    if (result.ref) {
        result.ref = encodeURI(searcher.configuration.baseUrl + '/' + searcher.configuration.applicationName + '/' + result.ref.split('/').slice(4, result.ref.split('/').length - 1).join('/'));
    }
    searchResult = {
        href: result.ref,
        score: result.score
    };
    searchResults.things.push(searchResult);
    return searchResult;
}

/**
 * Is the file at the given path a hidden file. In *nix operating systems, files whose names begin with a period
 * are hidden files.
 *
 * @param {string} path         Path to a file.
 * @returns {boolean}           True if the given path refers to a hidden file.
 */
function isNotHiddenFile(path) {
    'use strict';
    var components = path.split('/'),
        name = components.slice(components.length - 1).join();
    return name && (name.length > 0) && (name[0] !== '.');
}

/**
 * Loads things to be searched into this search index.
 *
 * @param {string} path     Path to a folder to begin loading from.
 * @param {function} next   Function called once things have been loaded.
 */
function load(path, next) {
    'use strict';
    var loggingContext = 'SearchIndex.load',
        searcher = this,
        work = [];
    if (path) {
        logger.info(loggingContext, 'Loading search information from "' + path + '"');
        fs.stat(path.toString(), function (error, status) {
            if (error) {
                logger.error(loggingContext, 'Could not read search information from "' + path + '"');
            } else {
                if (status.isDirectory()) {
                    logger.debug(loggingContext, 'Reading search information from the directory "' + path + '"');
                    fs.readdir(path.toString(), function (error, files) {
                        if (error) {
                            logger.error(loggingContext, error);
                        } else {
                            files.forEach(function (file) {
                                work.push(function (next) {
                                    searcher.load(path.toString() + '/' + file, next);
                                });
                            });
                            worker.doWork(work, function () {
                                next();
                            });
                        }
                    });
                } else {
                    if (path.split('/').pop() === 'thing.json') {
                        work.push(function (next) {
                            loadFile(path, searcher.index, next);
                        });
                    }
                    worker.doWork(work, function () {
                        next();
                    });
                }
            }
        });
    } else {
        next();
    }
}

/**
 * Loads a file's contents into this search index.
 *
 * @param {string} fileName     Name of the file to load.
 * @param index                 Search index to store file's contents into.
 * @param {function} next       Function called once a file's contents have been loaded.
 */
function loadFile(fileName, index, next) {
    'use strict';
    var loggingContext = 'SearchIndex.loadFile';
    logger.info(loggingContext, 'Reading search information from the file "' + fileName + '"');
    fs.readFile(fileName, function (error, data) {
        var object;
        if (error) {
            logger.error(loggingContext, error);
        } else {
            object = JSON.parse(data);
            object.id = fileName;
            index.add(object);
        }
        next();
    });
}

/**
 * Creates, and returns, a new search index.
 *
 * @param configuration         Configuration information for the application that the search index is part of.
 * @returns {newInstance}       A new search index.
 */
function newInstance(configuration) {
    'use strict';
    this.index = lunr(function () {
        this.field('name', { boost: 10 });
        this.field('description');
        this.field('shortDescription');
        this.field('title');
        this.field('tags'); /// TODO - Populate this field with tag names, not ids.
        this.ref('id');
    });
    this.configuration = configuration;
    this.load = load;
    this.search = search;
    return this;
}

/**
 * Searches this search index's contents.
 *
 * @param {string} query    What to search for.
 * @param response          Search results.
 */
function search(query, response) {
    'use strict';
    var resultLimit = 10,
        results = this.index.search(query),
        searcher = this,
        searchFields = {
            'description': 'Full description',
            'id': 'ID',
            'name': 'Name',
            'shortDescription': 'Short description',
            'title': 'Title'
        },
        searchResults = {},
        work = [];
    if (results && results.length) {
        searchResults.total = results.length;
        searchResults.things = [];
        searchResults.text = query;
        results.some(function (result, index) {
            var fileName = results[index].ref,
                id,
                searchResult,
                thing;
            searchResult = addSearchResult(searcher, searchResults, result);
            searchResults.limit = resultLimit;
            work.push(function (next) {
                fs.readFile(fileName, function (error, data) {
                    var foundInProperties = [],
                        lowerCaseQuery = query.toLowerCase(),
                        property;
                    if (error) {
                        logger.error(error);
                    } else {
                        thing = JSON.parse(data);
                        id = fileName.slice(fileName.indexOf('/types'), fileName.length);
                        searchResult.id = id.slice(0, id.indexOf('/thing.json'));
                        searchResult.name = thing.name;
                        searchResult.path = thing.path;
                        for (property in searchFields) {
                            if (searchFields.hasOwnProperty(property)) {
                                if (thing[property] && (thing[property].toLowerCase().indexOf(lowerCaseQuery) >= 0)) {
                                    foundInProperties.push(searchFields[property]);
                                }
                            }
                        }
                        searchResult.foundInProperties = foundInProperties;
                    }
                    next();
                });
            });
            return (index >= (resultLimit - 1)) || (index === (searchResults.length - 1));
        });
        worker.doWork(
            work,
            function () {
                response.writeHeader(200, { 'Content-Type': 'application/json' });
                response.write(JSON.stringify(searchResults));
                response.end();
            },
            resultLimit
        );
    } else {
        response.writeHeader(404, { 'Content-Type': 'text/plain' });
        response.write('404 Not Found: Search did not find "' + query + '"');
        response.end();
    }
}

exports.newInstance = newInstance;