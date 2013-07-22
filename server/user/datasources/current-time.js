var log = require('../../core/common').log(__filename);

var interval;

// A datasource module must export two functions: start and stop.
// start() is invoked when the datasource needs to be initialized, and
// stop() should clean up any connections or resources that the datasource
// is responsible for.

module.exports = {

	// The first attribute to start() is an object that will contain what's
	// defined for this datasource in server-config.json. For this specific
	// example of current-time, if server-config.json contained the following:
	//
	// {
	//     "datasources": {
	//         "current-time": {
	//             "format": "time"
	//         }
	//     }
	// }
	//
	// Then the config object here would be:
	//
	// { "format": "time" }

	// The second attribute to start() is an emitter that's provided by the
	// server. The emitter provides one available method, emitStat(), that
	// datasources use to make their stats available to displays.
	start: function (config, emitter) {

		function getTime(format) {
			var date = new Date();
			switch (format) {
			case 'iso':
				return date.toISOString();

			case 'date':
				return date.toDateString();

			case 'time':
				var string = date.toTimeString();
				return string.substring(0, string.indexOf(' '));

			case 'millis':
			default:
				return date.getTime();
			}
		}

		// In this case we're simulating a polled resource. However, a
		// datasource might work in any number of ways. It may poll and scrape
		// a web page, or it might connect to a streaming API. The implementation
		// doesn't matter much.

		interval = setInterval((function run () {

			var formatted = getTime(config.format);

			// This makes the 'current-time' stat available for displays to use.
			// The message structure has a couple of requirements:
			// - It must be an object
			// - It shouldn't use a property name of "source", since the server
			//   will automatically add that before emitting the message to
			//   clients.

			emitter.emitStat('current-time', {
				value: formatted
			});

			return run;

		}()), 1000);
	},

	stop: function () {
		if (interval) clearInterval(interval);
		interval = null;
	}
}
