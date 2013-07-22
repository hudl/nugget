var deferred = require('q');
var http     = require('http');
var https    = require('https');
var util     = require('util');
var moment   = require('moment');
var path     = require('path');
var log      = logger(__filename);

function writeLog (severity, filename, message) {
	var now = moment().format('YYYY-MM-DD HH:mm:ss.SSS')
	var line = util.format('[%s] [%s] [%s] - %s', now, severity, filename, message);
	console.log(line);
}

function logger (filename) {
	var lastSlashIndex = filename.lastIndexOf(path.sep);
	var file = filename.substring(lastSlashIndex + 1);
	return {
		debug: function (message) {
			writeLog('DEBUG', file, message);
		},

		error: function(message) {
			writeLog('ERROR', file, message);
		}
	}
}

function getJson (opts) {
    var def = deferred.defer();

    (opts.https === true ? https : http).get(opts, function (res) {
        var data = '';
        res.on('data', function (chunk) {
            data += chunk;
        });

        res.on('end', function () {
            try {
                def.resolve(JSON.parse(data));
            } catch (e) {
                log.error(e);
                def.reject(e);
            }
        });
    }).on('error', function (e) {
        log.error(e);
        def.reject(e);
    });

    return def.promise;
}

function isEmptyObject (obj) {
	return Object.keys(obj).length === 0;
}

module.exports = {
	getJson: getJson,
	isEmptyObject: isEmptyObject,
	log: logger
};
