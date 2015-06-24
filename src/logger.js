var chalk = require('chalk'),
    dateformat = require('dateformat');

var colors = ['magenta', 'red', 'white'],
    loggers = {};

module.exports = Logger;

function Logger(name) {
    loggers[name] = {
        name: name,
        color: colors[Object.keys(loggers).length % colors.length]
    };

    this.name = name;
    this.color = loggers[name].color;
    this.profilings = {};
}

Logger.prototype.info = function() {
    var time = '[' + chalk.yellow(dateformat(Date.now(), 'HH:MM:ss')) + ']';
    var name = '[' + chalk[this.color](this.name) + ']';
    process.stdout.write(time + ' ' + name + ' ');
    console.log.apply(console, arguments);
    return this;
};

Logger.prototype.profile = function(profileName) {
    if (!this.profilings[profileName]) this.profilings[profileName] = { name: profileName };

    return {
        start: start.bind(this),
        end: end.bind(this)
    };

    function start(desc) {
        this.profilings[profileName].start = Date.now();
        this.profilings[profileName].desc = desc;

        var info = '[' + chalk.green('init') + '] ' + desc;
        this.info(info);
    }

    function end() {
        var duration = Date.now() - this.profilings[profileName].start,
            desc = this.profilings[profileName].desc;

        var info = '[' + chalk.green('done') + '] ' + desc;
        var args = [].concat(info, Array.prototype.slice.apply(arguments));

        args.push(chalk.green('+' + duration + 'ms'));

        this.info.apply(this, args);
    }
};

