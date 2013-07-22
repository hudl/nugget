// Displays are defined as require.js modules.
define(function () {

	function initialize (socket) {
		console.log('Initialized');
	}

	function onStat (message) {
		$('#time').text(message.value);
	}

	// A display module should return an object that defines what stats
	// (i.e. sources) it needs. The module can (and probably should) define a
	// couple of event callbacks (see below).

	return {

		// A list of stats (sources) this module wants to consume. The values
		// here will match the value that a datasource module passes as the first
		// argument to emitter.emitStat().
		sources: [
			'current-time'
		],

		// Callback to invoke when a new stat is received. The callback will be
		// passed the stat's message object. The message object will also contain
		// a new property, source, that's the stat's source name (e.g.
		// "current-time").
		// 
		// This callback should be the one that manipulates the page to update
		// or re-display the new information.
		//
		// If the display uses multiple sources, the callback can switch on the
		// "source" property of the message.
		onStat: onStat,

		// This callback will be invoked whenever this display is loaded. It will
		// be passed the socket.io object used for communicating with the server.
		initialize: initialize
	}

});
