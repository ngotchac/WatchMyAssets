var path = require('path'),
    flo = require('fb-flo');

module.exports = {
    start: start
};

function start(projectConfig, assets) {
    var AssetBuilder = require('./asset-builder')(projectConfig);

    flo(
        path.join(projectConfig.APP, 'Assets'),
        {
            port: 8888,
            host: 'localhost',
            verbose: false,
            glob: [
                '**/*.js',
                '**/*.css',
                '**/*.scss',
                '**/*.html'
            ]
        },
        function resolver(filePath, callback) {
            console.log('File changed', filePath);
            filePath = path.join(projectConfig.APP, 'Assets', filePath);

            /** An Array of the Path of the Assets to build */
            var assetPaths = Object.keys(assets).filter(function(assetName) {
                return assets[assetName].files.indexOf(filePath) >= 0 ||
                        assets[assetName].dependencies.indexOf(filePath) >= 0;
            });

            assetPaths.forEach(function(assetPath) {
                    AssetBuilder.build(assets[assetPath], function(err, fileContent) {
                        if (err) return console.log(err);

                        callback({
                            resourceURL: assetPath.split('/').pop(),
                            match: 'indexOf',
                            // reload: assetPath.split('.').pop() === 'js',
                            contents: fileContent,
                            update: function() {
                                console.log('File updated!', arguments[1]);
                            }
                        });
                    });
            });
        }
    );
}

