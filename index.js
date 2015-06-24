var AssetUtils = require('./src/asset-utils'),
    PhpUtils = require('./src/php-utils'),
    FloServer = require('./src/flo-server'),
    Logger = require('./src/logger'),

    path = require('path'),
    nconf = require('nconf'),
    inquirer = require('inquirer'),
    Orchestrator = require('orchestrator');

nconf
    .file({ file: path.join(__dirname, 'conf.json') })
    .argv({
        p: {
            alias: 'php-index',
            describe: 'Path of the PHP Index File'
        }
    });

if (!nconf.get('php-index')) {
    inquirer.prompt([{
        type: 'input',
        name: 'php-index',
        message: 'Please enter the fullpath to the "index.php" file'
    }], function(answers) {
        nconf.set('php-index', answers['php-index']);
        main();
    });
} else main();

function main() {
    var log = new Logger('main'),
        orchestrator = new Orchestrator(),
        projectConfig, assets;

    orchestrator.add('php-constants', function() {
        var phpIndexPath = nconf.get('php-index');

        log.profile('php-constants').start('Retrieving PHP Constants');

        return PhpUtils
            .getConstants(phpIndexPath)
            .then(function(phpConstants) {
                log.profile('php-constants').end('PHP Constants retrieved.');

                projectConfig = {
                    APP: phpConstants.APP,
                    WEBROOT: phpConstants.WWW_ROOT
                };
            });
    });

    orchestrator.add('assets-dependencies', ['php-constants'], function() {
        log.profile('asset-builder').start('Getting Assets Dependencies');

        return AssetUtils
            .getAssetDependencies(projectConfig)
            .then(function(returnedAssets) {
                log.profile('asset-builder').end();
                assets = returnedAssets;
            });
    });

    orchestrator.add('build-assets', ['assets-dependencies'], function() {
        var AssetBuilder = require('./src/asset-builder')(projectConfig);

        log.profile('build-assets').start('Building all assets');

        var promises = Object.keys(assets).map(function(assetPath) {
            return new Promise(function(resolve, reject) {
                AssetBuilder.build(assets[assetPath], function(err) {
                    if (err) return reject(err);
                    resolve();
                });
            });
        });

        return Promise
            .all(promises)
            .then(function() {
                log.profile('build-assets').end();
            });
    });

    orchestrator.add('flo-server', ['build-assets'], function() {
        log.info('Starting FB-Flo Server.');

        return FloServer.start(projectConfig, assets);
    });

    orchestrator.start('build-assets', 'flo-server', function(err) {
        if (err) console.error(err);
    });
}

