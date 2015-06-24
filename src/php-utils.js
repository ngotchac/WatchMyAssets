
var spawn = require('child_process').spawn,
    path = require('path');

module.exports = {
    getConstants: getConstants
};

/**
 * Retrieves the Constants defined in
 * the PHP Application, from the given
 * indexPath.
 * Returns a Promise wich resolves with an
 * Object.
 *
 * @param {String} indexPath - The fullpath of the `index.php` file
 * @returns {Promise}
 */
function getConstants(indexPath) {
    return new Promise(function(resolve, reject) {
        var php = spawn('php', [path.join(__dirname, 'get_constants.php'), indexPath]),
            fullData = '';

        php.stdout.on('data', function(data) {
            fullData += data;
        });

        php.stderr.on('data', function(err) {
            reject(err);
        });

        php.on('close', function(code) {
            if (code !== 0) return reject('PHP Process ended with process code ' + code);

            try {
                var phpConstants = JSON.parse(fullData);
                resolve(phpConstants);
            } catch (e) {
                reject(e);
            }
        });
    });
}

