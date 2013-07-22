var log = require('../../core/common').log(__filename);

var interval;

module.exports = {
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

		interval = setInterval((function run () {

			var formatted = getTime(config.format);
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
