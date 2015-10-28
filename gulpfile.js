/*globals require*/

var cover = require('gulp-coverage'),
    del = require('del'),
    gulp = require('gulp'),
    gzip = require('gulp-zip'),
    jasmine = require('gulp-jasmine'),
    moment = require('moment'),
    plugins = require('gulp-load-plugins')(),
    reporters = require('jasmine-reporters'),
    run = require('gulp-run');

gulp.task('build', ['default'], function () {
    'use strict';
});

gulp.task('clean', function (callback) {
    'use strict';
    del(['./target/**'], callback);
});

gulp.task('default', ['clean', 'lint:js', 'test'], function () {
    'use strict';
    gulp.start('deploy');
});

gulp.task('deploy', ['pack'], function () {
    'use strict';
});

gulp.task('lint:js', function () {
    'use strict';
    return gulp.src([
        'gulpfile.js',
        'src/main/javascript/*.js',
        'src/test/javascript/*.js'
    ]).pipe(plugins.jscs())
        .pipe(plugins.jshint())
        .pipe(plugins.jshint.reporter('jshint-stylish'));
});

gulp.task('pack', ['stage'], function () {
    'use strict';
    var time = moment().format('MM-DD-YYYY');
    return gulp.src(['package.json', '**/*.js', '!debug/**', '!gulpfile.js', '!node_modules', '!node_modules/**', '!src/main/test/**', '!temp', '!temp/**', './third-party/**'])
        .pipe(gzip('sqwerl-server-' + time + '.zip'))
        .pipe(gulp.dest('target'));
});

gulp.task('run', function (callback) {
    'use strict';
    var serverCommand = new run.Command('node index.js ../resources/development_configuration.json', { cwd: 'src/main/javascript' });
    serverCommand.exec();
});

gulp.task('stage', function () {
    'use strict';
    // TODO
});

gulp.task('test', function () {
    'use strict';
    return gulp.src('src/test/javascript/*.spec.js')
        .pipe(cover.instrument({
            debugDirectory: 'debug',
            pattern: ['src/main/javascript/*.js']
        })).pipe(jasmine({
            includeStackTrace: true,
            reporter: new reporters.JUnitXmlReporter({ savePath: 'target/reports/tests' }),
            verbose: true
        })).pipe(cover.gather())
            .pipe(cover.format())
            .pipe(gulp.dest('target/reports/tests'));
});
