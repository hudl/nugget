$(function  () {
	var socket = io.connect();

	// TODO pushState/replaceState when opening nugget view (for back button)

    socket.on('connect', function () {
        socket.emit('dashboard');
		hideNugget();
		$('#connection-status').text('Connected').removeClass().addClass('connected');
    });

    socket.on('disconnect', function () {
        $('#nuggets > li, #stats > tbody > tr').remove();
		hideNugget();
		$('#connection-status').text('Not connected').removeClass().addClass('disconnected');
    });

	socket.on('available-pages', _.once(function (pages) {
		var list = $('#nugget-view ul#pages');
		for(var i = 0; i < pages.length; i++) {
			list.append('<li><button type="button" class="page" data-page="' + pages[i] + '">' + pages[i] + '</button></li>');
		}
	}));

    socket.on('nugget-info', function (message) {
        var nuggets = $('#nuggets');
        var nugget = nuggets
			.find('> li > .socket-id:contains("' + message.socket + '")')
			.closest('li');

        if (nugget.length === 0) {
            nugget = $('<li><div class="name"></div><div class="ip-address"></div><div class="page"></div><div class="socket-id"></div></li>');
			nugget.find('.socket-id').text(message.socket);
			nugget.appendTo(nuggets);

			nugget.click(function () {
				showNugget(message.socket);
			});
        }
		nugget.find('.name').text(message.hostname);
		nugget.find('.ip-address').text(message.ip);
		nugget.find('.page').text(message.page);

		// If we're showing the nugget, try to update it.
		var nuggetView = $('#nugget-view');
		if ($('#nugget-view').data('socket-id') == message.socket) {
			setNuggetViewData({
				socketId: message.socket,
				name: message.hostname,
				ipAddress: message.ip,
				page: message.page
			});
		}
    });

    socket.on('nugget-remove', function (message) {
        console.log('Removing ' + JSON.stringify(message));
        $('#nuggets > li > .socket-id:contains("' + message.socket + '")').closest('li').remove();
		if ($('#nugget-view').data('socket-id') == message.socket) {
			hideNugget();
		}
    });

	function showNugget (socketId) {
		var nugget = $('#nuggets > li > .socket-id:contains("' + socketId + '")').closest('li');
		var name = nugget.find('.name').text();
		var ipAddress = nugget.find('.ip-address').text();
		var page = nugget.find('.page').text();

		setNuggetViewData({
			socketId: socketId,
			name: name,
			ipAddress: ipAddress,
			page: page
		});

		$('#main-view').hide();
		$('#spinner').show();
		setTimeout(function () {
			$('#nugget-view').show();
			$('#spinner').hide();
		}, 500); // really, really janky ghost click prevention
	}

	function setNuggetViewData (attrs) {
		var view = $('#nugget-view');
		view.data('socket-id', attrs.socketId);
		view.find('h1').text(attrs.name);
		view.find('.address').text(attrs.ipAddress);

		view.find('#pages li button').removeClass('current');
		view.find('#pages li button[data-page="' + attrs.page + '"]').addClass('current');
	}

	function hideNugget () {
		var view = $('#nugget-view');
		if (view.is(':hidden')) return;

		view.hide();
		$('#spinner').show();
		setTimeout(function () {
			$('#main-view').show();
			$('#spinner').hide();
		}, 500); // really, really janky ghost click prevention
	}

	$('#close').click(function () {
		hideNugget();
	});

	$('#reload-page').click(function () {
		var socketId = $('#nugget-view').data('socket-id');
		socket.emit('reload-page', socketId);
	});

	$('#reboot').click(function () {
		if (confirm('Reboot?')) {
			var socketId = $('#nugget-view').data('socket-id');
			socket.emit('reboot', {
				socket: socketId
			});
		}
	});

	$('#toggle-projector').click(function () {
		if (confirm('Toggle projector?')) {
			var socketId = $('#nugget-view').data('socket-id');
			socket.emit('toggle-projector', {
				socket: socketId
			});
		}
	});

	$('#projector-on').click(function () {
		if (confirm('Turn projector on?')) {
			var socketId = $('#nugget-view').data('socket-id');
			socket.emit('projector-on', {
				socket: socketId
			});
		}
	});

	$('#projector-off').click(function () {
		if (confirm('Turn projector off?')) {
			var socketId = $('#nugget-view').data('socket-id');
			socket.emit('projector-off', {
				socket: socketId
			});
		}
	});

	$('#nugget-view').on('click', '#pages button', function (e) {
		var button = $(e.target);
		var page = button.data('page');
		socket.emit('switch-page', {
			socket: $('#nugget-view').data('socket-id'),
			page: page
		});
	});

	// TODO hide/disable if there aren't any connected nuggets
	$('.custom-text .custom-text-value').keyup(function (e) {
		var field = $(e.target);
		var value = $.trim(field.val());
		var hasValue = (value.length > 0);
		var wrapper = field.closest('.custom-text');
		wrapper.toggleClass('disabled', !hasValue);
	});

	$('#main-view .custom-text > form').submit(function (e) {
		var form = $(e.target);
		var field = form.find('.custom-text-value');
		var socketIds = [];
		var duration = parseInt(form.find('.custom-text-duration').val(), 10);
		$('#main-view #nuggets > li > .socket-id').each(function () {
			socketIds.push($(this).text());
		});
		socket.emit('custom-text', {
			text: field.val(),
			duration: duration,
			socketIds: socketIds
		});
		//field.val('');
		e.preventDefault();
	});

	$('#nugget-view .custom-text > form').submit(function (e) {
		var form = $(e.target);
		var field = form.find('.custom-text-value');
		var socketId = $('#nugget-view').data('socket-id');
		var duration = parseInt(form.find('.custom-text-duration').val(), 10);
		socket.emit('custom-text', {
			text: field.val(),
			duration: duration,
			socketIds: [socketId]
		});
		//field.val('');
		e.preventDefault();
	});
});
