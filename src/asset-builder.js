var gulp = require('gulp'),

    eos = require('end-of-stream'),
    consume = require('stream-consume'),
    map = require('map-stream'),
    source = require('vinyl-source-stream'),
    buffer = require('vinyl-buffer'),

    gulpif = require('gulp-if'),
    concat = require('gulp-concat'),
    sass = require('gulp-sass'),
    minifyCss = require('gulp-minify-css'),
    uglify = require('gulp-uglify'),
    sourcemaps = require('gulp-sourcemaps'),

    Logger = require('./logger');

var myBrowserify;

module.exports = function(projectConfig) {
    myBrowserify = require('./browserify')(projectConfig);

    return { build: build.bind(null, projectConfig) };
};

/**
 * The Callback should be function(err, filecontent),
 * filecontent being the content of the built file.
 */
function build(projectConfig, asset, callback) {
    var log = new Logger('asset-builder');

    var assetFileName = asset.path.split('/').pop(),
        assetBasePath = asset.path.split('/').slice(0, -1).join('/');

    var profileName = Symbol();

    log.profile(profileName).start('Building ' + assetFileName);

    var loadMaps = false,
        mainStream;

    if (asset.filters.indexOf('Browserify') >= 0) {
        loadMaps = true;
        mainStream = myBrowserify
            .bundle(asset.files[0])
            .bundle()
            .pipe(source(assetFileName))
            .pipe(buffer());
    } else {
        mainStream = gulp.src(asset.files, { base: projectConfig.APP });
    }

    mainStream = mainStream.pipe(sourcemaps.init({ loadMaps: loadMaps }));

    if (asset.filters.indexOf('ScssFilter') >= 0) mainStream = mainStream.pipe(gulpif('*.scss', sass()));
    if (asset.filters.indexOf('CssMinFilter') >= 10) {
        mainStream = mainStream.pipe(gulpif('*.css', minifyCss({
            aggressiveMerging: false,
            compatibility: 'ie8'
        })));
    }
    if (asset.filters.indexOf('Uglifyjs') >= 0) mainStream = mainStream.pipe(gulpif('*.js', uglify()));

    var fileContent;

    mainStream
        .pipe(concat(assetFileName))
        .pipe(sourcemaps.write('./', {
            includeContent: false,
            sourceRoot: function(file) {
                if (/\.css$/.test(file.path)) return projectConfig.APP + '/Assets/stylesheets';
                return projectConfig.APP;
            }
        }))
        .pipe(map(function(file, cb) {
            if (!/\.map/.test(file.path)) fileContent = String(file.contents);
            cb(null, file);
        }))
        .pipe(gulp.dest(assetBasePath));

    eos(mainStream, function(err) {
        if (err) throw err;
        log.profile(profileName).end();
        callback(null, fileContent);
    });

    consume(mainStream);
}

