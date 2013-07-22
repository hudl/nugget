define(function () {

	function initialize (socket) {
		console.log('Initialized');
	}

	function onStat (message) {
		$('#time').text(message.value);
	}

	return {
		sources: [
			'current-time'
		],
		onStat: onStat,
		initialize: initialize
	}

});
