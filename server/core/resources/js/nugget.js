$(function () {
    console.log('Connecting');

	var defaultPage = 'current-time';

    var socket = io.connect();
	var loadedCss = {};

	var currentModule;

	var allowNav = false;

	function subscribeModule (module) {
		if (!module || !module.sources) return;

		for (var i = 0; i < module.sources.length; i++) {
			socket.emit('subscribe', module.sources[i]);
		}
	}

	function requestModuleSources (module) {
		if (!module || !module.sources) return;
		for (var i = 0; i < module.sources.length; i++) {
			socket.emit('request', module.sources[i]);
		}
	}

	function loadPage (name) {
		console.log('Loading display: ' + name);

		allowNav = false;
		$('body').fadeOut(200, function () {

			history.replaceState({ display: name }, '', '/display/' + name);

			var resource = '/static-displays/' + name;
			var js = resource + '.js';
			var css = resource + '.css';
			var html = resource + '.html';
		
			$('body > *').remove(); // Kinda hacky, would rather have events drive this.

			$('body').load(html, function () {
				if (!loadedCss[css]) {
					var sheet = $('<link rel="stylesheet" type="text/css"/>').attr('href', css);
					$('head').append(sheet);
					loadedCss[css] = true;
				}

				require([js], function (module) {
					currentModule = module;

					socket.emit('announce-page', name);
					subscribeModule(module);

					if (module.initialize) module.initialize(socket);

					setTimeout(function () {
						// FIXME not great, would be nice to do this after we know everything's loaded
						// but it works for now.
						requestModuleSources(module);
						$('body').fadeIn(500);
						allowNav = true;
					}, 200);
				});
			});
		});
	};

	function showDisconnected () {
		var mask = $('#disconnected-mask');
		if (mask.length) return;
		$('body').append('<div id="disconnected-mask">:)</div>');
	}

	function getDisplayFromUrl () {
		var displayIndex = document.URL.indexOf('/display/');
		if (displayIndex < 0) return undefined;
		return document.URL.substring(displayIndex + '/display/'.length);
	}

	socket.on('switch-page', function (name) {
		loadPage(name);
	});

    socket.on('connect', function () {
		// Don't worry about removing the #disconnected-mask, loadPage() should clear the <body>.
		var page = getDisplayFromUrl() || defaultPage;
		loadPage(page);
    });

	socket.on('stat', function (message) {
		if (currentModule && currentModule.onStat) currentModule.onStat.call(this, message);
	});

    socket.on('reload-page', function () {
        console.log('Reloading page');
        window.location.reload(true);
    });

	socket.on('disconnect', function () {
		showDisconnected();
	});

	// Last-ditch hedge against an inability to reconnect.
	setInterval(function () {
		if (socket.socket.connected) return;
		$.get('/', function () {
			// What most likely happened is that we lost connection and all of the subsequent
			// socket.io reconnect attempts failed. It's possible that we've reconnected
			// but socket.io isn't attempting to reconnect anymore. If we can get to the page, reload.
			window.location.reload(true);
		});
	}, 600000);

	$(document).keyup(function (e) {
		if (allowNav && (e.which == 37)) {
			socket.emit('prev-display', getDisplayFromUrl());
		}

		if (allowNav && (e.which == 39)) {
			socket.emit('next-display', getDisplayFromUrl());
		}
	});
}());
