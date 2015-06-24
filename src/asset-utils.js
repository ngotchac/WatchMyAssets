/**
 * Utils functions for the Assets.
 * Get the Assets List, the Assets
 * dependencies, etc...
 *
 * @namespace AssetUtils
 */
var fs = require('fs'),
    path = require('path'),
    ini = require('ini'),

    lodash = require('lodash'),
    sassGraph = require('sass-graph'),

    Logger = require('./logger');

var log = new Logger('asset-utils');

module.exports = {
    getAssetDependencies: getAssetDependencies
};

/**
 * Get a Promise that is resolved with the an Object
 * which keys are the assets fullpaths, and the value
 * conatining the dependencies files.
 *
 * @returns Promise
 */
function getAssetDependencies(projectConfig) {
    log.profile('config').start('Config Dependencies');
    var assets = getAssetsFromConfig(projectConfig);
    log.profile('config').end();

    log.profile('Sass').start('Sass Dependencies');
    addSassDependencies(assets);
    log.profile('Sass').end();

    log.profile('Browserify').start('Browserify Dependencies');
    return addBrowserifyDependencies(projectConfig, assets)
        .then(function(newAssets) {
            log.profile('Browserify').end();
            return newAssets;
        });
}

function getAssetsFromConfig(projectConfig) {
    var APP = projectConfig.APP,
        WEBROOT = projectConfig.WEBROOT;

    var assetConfig = ini.parse(fs.readFileSync(path.join(APP, 'Config', 'asset_compress.local.ini'), 'utf-8')),
        config = ini.parse(fs.readFileSync(path.join(APP, 'Config', 'asset_compress.ini'), 'utf-8'));

    var defaultFilters = {
            js: assetConfig.js.filters,
            css: assetConfig.css.filters
        };

    var cachePaths = {
            js: assetConfig.js.cachePath.replace('WEBROOT', WEBROOT),
            css: assetConfig.css.cachePath.replace('WEBROOT', WEBROOT)
        };

    var assetsPaths = {
            js: assetConfig.js.paths.map(function(p) { return p.replace('APP', APP).replace('*', ''); }),
            css: assetConfig.css.paths.map(function(p) { return p.replace('APP', APP).replace('*', ''); })
        };

    var assets = {};

    Object.keys(config).forEach(function(configAssetName) {
        var tmp = config[configAssetName],
            key;

        if (tmp.js) key = 'js';
        else if (tmp.css) key = 'css';

        // Get the current Asset BaseName and Path
        // As their name in the ini config are 'js_foobar.js' or 'css_foobaz.css'
        var assetBaseName = configAssetName.split('_').splice(1).join('_'),
            filters = defaultFilters[key].concat(tmp[key].filters).filter(function(e) { return e; }),
            assetPath = path.join(cachePaths[key], assetBaseName + '.' + key);

        // Initialize the values if not already set
        if (!assets[assetPath]) {
            assets[assetPath] = {
                files: [],
                dependencies: [],
                filters: filters,
                path: assetPath
            };
        }

        tmp[key].files.forEach(function(filename) {
            // Resolve the file, as it could be unexistant...
            filename = resolvePath(filename, assetsPaths[key]);
            if (!filename) return;

            // Link the File to the current Asset
            assets[assetPath].files.push(filename);
        });
    });

    return assets;
}

function addSassDependencies(assets) {
    // For each asset in the assets, get all the linked
    // SASS files, get their dependencies, and add them to
    // the same asset Object
    Object.keys(assets).forEach(function(assetName) {
        var asset = assets[assetName];

        // Check that Browserify is in the Filters
        if (asset.filters.indexOf('ScssFilter') === -1) return false;

        var sassFiles = asset.files.filter(function(filepath) {
            return /\.scss/.test(filepath);
        });

        sassFiles.forEach(function(sassFile) {
            var depGraph = sassGraph.parseFile(sassFile);

            Object.keys(depGraph.index).forEach(function(dependencyFullpath) {
                if (asset.dependencies.indexOf(dependencyFullpath) === -1) asset.dependencies.push(dependencyFullpath);
            });
        });
    });
}

function addBrowserifyDependencies(projectConfig, assets) {
    var browserify = require('./browserify')({ APP: projectConfig.APP });

    var promises = Object.keys(assets).map(function(assetPath) {
        var asset = assets[assetPath];

        // Check that Browserify is in the Filters
        if (asset.filters.indexOf('Browserify') === -1) return false;

        var assetPromises = asset.files.map(function(jsFullpath) {
            return browserify.getDependencies(jsFullpath);
        });

        return Promise
            .all(assetPromises)
            .then(function(dependenciesArray) {
                var dependencies = lodash.flatten(dependenciesArray);
                asset.dependencies = lodash.union(asset.dependencies, dependencies);
            });
    });

    return Promise
        .all(promises)
        .then(function() {
            return assets;
        });
}

function resolvePath(filename, paths) {
    var fullPath;

    paths.some(function(root) {
        var checkPath = path.join(root, filename);
        try {
            var stats = fs.lstatSync(checkPath);
            if (stats.isFile() && stats.size) {
                fullPath = checkPath;
                return true;
            }
        } catch (e) {
            return false;
        }
        return false;
    });

    return fullPath;
}

