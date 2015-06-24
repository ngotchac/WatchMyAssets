var browserify = require('browserify');

var cssify = require('cssify'),
    brfs = require('brfs');

var fs = require('fs'),
    path = require('path');

module.exports = main;

function main(config) {
    var basepath = path.join(config.APP, 'Assets/ng-traackr/src');

    return {
        bundle: bundle,
        getDependencies: getDependencies
    };

    function bundle(entryFile) {
        var entry = fs.createReadStream(entryFile);

        var b = browserify(entry, {
                basedir: basepath,
                debug: true
            });

        b
            .transform(brfs)
            .transform(cssify, {
                global: true
            });

        return b;
    }

    function getDependencies(entryFile) {
        return new Promise(function(resolve, reject) {
            var writable = require('stream').Writable;
            var devnull = writable();
            var deps = [];

            devnull._write = function () {
                resolve(deps);
            };

            bundle(entryFile)
                .on('error', reject)
                .on('file', function(file) {
                    deps.push(file);
                })
                .on('transform', function (tr) {
                    tr.on('file', function (dep) {
                        deps.push(dep);
                    });
                })
                .bundle()
                .pipe(devnull);
        });
    }
}

