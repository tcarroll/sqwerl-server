/*globals process, require */

/**
 * Tests the validity and integrity of a database of persistent things.
 */
var logger = require('./logger').newInstance('Checker'),

    tester;

if (process.argv.length > 2) {
    tester = require('./tester');
    tester.test(process.argv[2], (process.argv.length > 3) ? process.argv[3] : null);
} else {
    logger.error('', 'Usage: node checker <database folder> [<parent database folder>]');
    logger.error('', '  Where <database folder> is a folder that contains a database of things.');
    logger.error('', '        <parent database folder> is an optional folder that contains a database of things');
    logger.error('', '                                 that are shared with the first database.');
}

