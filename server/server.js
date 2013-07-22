var express   = require('express');
var app       = express();
var server    = require('http').createServer(app);
var io        = require('socket.io').listen(server);
var fs        = require('fs');
var child     = require('child_process');
var common    = require('./core/common');
var log       = common.log(__filename);

// TODO
// - Clean up logging, make errors more noticeable
//    - Maybe have "core" logs, and then enable per-datasource severity setting via config
// - Make server.js more modular, expose a start() or init()
// - Add "main" to package.json
// - Fix inconsistent paths in logs on windows
// - Show active datasources on dashboard
// - Get rid of the hacky *Sync() calls in here

// -- constants

var configPath = __dirname + '/server-config.json';
var userStaticPath = __dirname + '/user/resources';
var coreStaticPath = __dirname + '/core/resources';
var viewsPath = __dirname + '/core/views';
var displaysPath = __dirname + '/user/displays';
var datasourcesPath = __dirname + '/user/datasources';
var defaultPort = 42420;
var clientScriptDir = '/home/pi/wallnugget-client';

io.set('log level', 1);

log.debug('Starting up');

// --- general set-up

var config = {};
try {
	var file = fs.readFileSync(configPath);
	config = (file && JSON.parse(file)) || {};
} catch (e) {
	log.debug('Error loading config file at [' + configPath + '], defaults will be used');
}

var availablePages = determineAvailablePages();

function socketLog (socket, message) {
	var hostname = hostnames[socket.id];
	log.debug('[' + socket.handshake.address.address + ' ' + socket.id + (hostname ? ' ' + hostname : '') + '] ' + message);
}

server.listen(config.server && config.server.port ? config.server.port : defaultPort);

// -- express.js routing

app.use('/static-user', express.static(userStaticPath));
app.use('/static-displays', express.static(displaysPath));
app.use('/static-core', express.static(coreStaticPath));

app.get('/', function (req, res) {
	res.sendfile(viewsPath + '/nugget.html');
});

app.get('/dashboard', function (req, res) {
	res.sendfile(viewsPath + '/dashboard.html');
});

// --- socket.io interactions - the meat of the server

var latestStats = {}; // Most recent stat values, used when new connections are established. 
var hostnames = {};

io.sockets.on('connection', function (socket) {
	socketLog(socket, 'connected');

	socket.on('subscribe', function (source) {
		subscribeToStat(socket, source);
	});

	socket.on('unsubscribe', function (source) {
		unsubscribeFromStat(socket, source);
	});

	socket.on('announce-page', function (page) {
		subscribeToPage(socket, page);
		emitNuggetInfo(socket);
	});

	child.exec('ssh -oBatchMode=yes -o "StrictHostKeyChecking no" -tt pi@' + socket.handshake.address.address + ' hostname', function (err, stdout, stderr) {
		var hostname = stdout.trim();
		if (hostname.length > 0) {
			hostnames[socket.id] = hostname;
			socketLog(socket, 'has hostname ' + hostname);
			emitNuggetInfo(socket);

			// kinda jank
			var defaultPage = config['default-pages'] ? config['default-pages'][hostname] : undefined;
			if (defaultPage) switchPage(socket, defaultPage);
		}
	});

	socket.on('dashboard', function () {
		socketLog(socket, 'is a dashboard');
		socket.join('dashboard');

		var clients = io.sockets.clients();
		for(var i = 0, client; client = clients[i]; i++) {
			if (!isDashboard(client)) {
				emitNuggetInfo(client);
			}
		}

		emitAvailablePages();

		socket.on('reload-page', function (id) {
			var s = io.sockets.sockets[id];
			if (!s) { 
				log.debug('Ignoring reload-page request for ' + id);
				return;
			}

			socketLog(s, 'is getting a hard page reload');
			s.emit('reload-page');
		});

		socket.on('switch-page', function (message) {
			var socket = io.sockets.sockets[message.socket];
			switchPage(socket, message.page);
		});

		function runCommandOnClient(socketId, command) {
			var socket = io.sockets.sockets[socketId];
			var addr = socket.handshake.address.address;
			var fullCommand = 'ssh -oBatchMode=yes -o "StrictHostKeyChecking no" -tt pi@' + addr + ' ' + command;

			socketLog(socket, 'Running command [' + fullCommand + ']');
			child.exec(fullCommand, function (err, stdout, stderr) {
				log.debug('ssh ' + addr + ' stdout: ' + stdout);
				log.debug('ssh ' + addr + ' stderr: ' + stderr);
				if (err) {
					log.error('ssh ' + addr + ' error: ' + err);
				}
			});
		}

		socket.on('toggle-projector', function (message) {
			runCommandOnClient(message.socket, clientScriptDir + '/projector_power_twice.sh');
		});

		socket.on('projector-on', function (message) {
			runCommandOnClient(message.socket, clientScriptDir + '/projector_on.sh');
		});

		socket.on('projector-off', function (message) {
			runCommandOnClient(message.socket, clientScriptDir + '/projector_off.sh');
		});

		socket.on('reboot', function (message) {
			runCommandOnClient(message.socket, '"sudo reboot"');
		});

		socket.on('custom-text', function (message) {
			log.debug('Sending custom text message [' + message.text + '] to ' + message.socketIds.length + ' clients');
			for(var i = 0; i < message.socketIds.length; i++) {
				var socket = io.sockets.sockets[message.socketIds[i]];
				emitCustomTextStat(socket, message);
			}
		});
	});

	// Requests a stat be emitted to this socket for the specified source
	// Should be used sparingly (usually on initial client load, and nowhere else).
	socket.on('request', function (source) {
		socketLog(socket, 'explicitly requested stat for ' + source);
		emitStatFromCache(socket, source);
	});

	socket.on('disconnect', function () {
		socketLog(socket, 'disconnected');
		emitNuggetDisconnect(socket);
	});
});

function switchPage (socket, newPage) {
	var currentPage = pageFor(socket);
	if (!currentPage || newPage == currentPage) {
		socketLog(socket, 'is not switching to page ' + newPage + ', it\'s already there');
		return;
	}

	socketLog(socket, 'is switching to page ' + newPage);
	unsubscribeAll(socket);
	socket.emit('switch-page', newPage);
}

function subscribeToStat (socket, source) {
	socketLog(socket, 'subscribed to stat ' + source);
	socket.join('stat/' + source);
	emitStatFromCache(socket, source);
	emitNuggetInfo(socket);
}

function unsubscribeFromStat (socket, source) {
	socketLog(socket, 'unsubscribed from stat ' + source);
	socket.leave('stat/' + source);
}

function subscribeToPage (socket, page) {
	socketLog(socket, 'joined page ' + page);
	socket.join('page/' + page);
}

// Leaves all stats and pages.
function unsubscribeAll (socket) {
	var rooms = socket.manager.roomClients[socket.id];
	for (var room in rooms) {
		if (!rooms.hasOwnProperty(room) || room === '' || !rooms[room]) continue;
		var name = room.substring(1); // Remove the leading slash.
		socketLog(socket, 'unsubscribed from ' + name);
		socket.leave(name);
	}
}

function isDashboard (socket) {
	var rooms = socket.manager.roomClients[socket.id];
	for (var room in rooms) {
		if (room == '/dashboard') return true;
	}
	return false;
}

function emitStatFromCache (socket, source) {
	if (latestStats.hasOwnProperty(source)) {
		log.debug('Emit (cached) - ' + source + ' = ' + JSON.stringify(latestStats[source]));
		socket.emit('stat', latestStats[source]);
	}
}

function emitCustomTextStat (socket, stat) {
	socketLog(socket, 'is getting custom text [' + stat.text + ']');
	socket.emit('stat', {
		source: 'custom-text',
		duration: stat.duration,
		value: stat.text
	});
}

function emitStat (source, message, dashboardOnly) {
	var m = message;
	log.debug('Emit (live)  - ' + source + ' = ' + JSON.stringify(message));

	m['source'] = source;
	if (dashboardOnly !== true) {
		io.sockets.in('stat/' + source).emit('stat', message);
	}
	io.sockets.in('dashboard').emit('stat', message);
	latestStats[source] = message;
}

function pageFor (socket) {
	var rooms = io.sockets.manager.roomClients[socket.id];
	for (var room in rooms) {
		if (!rooms.hasOwnProperty(room) || room === '' || !rooms[room]) continue;
		var name = room.substring(1); // Remove leading slash.
		if (name.indexOf('page/') > -1) {
			return name.substring('page/'.length);
		}
	}
	return undefined;
}

function emitNuggetInfo (socket) { // 'socket' is the socket to emit info for (not the destination)
	var page = pageFor(socket) || 'Unknown';
	io.sockets.in('dashboard').emit('nugget-info', {
		socket: socket.id,
		ip: socket.handshake.address.address,
		page: page,
		hostname: hostnames[socket.id] || 'Unnamed'
	});
}

function emitAvailablePages () {
	io.sockets.in('dashboard').emit('available-pages', availablePages);
}

function emitNuggetDisconnect (socket) {
	io.sockets.in('dashboard').emit('nugget-remove', {
		socket: socket.id
	});
}

function determineAvailablePages () {
	var pages = [];
	var files = fs.readdirSync(displaysPath);
	for(var i = 0; i < files.length; i++) {
		var file = files[i];
		var ext = file.substring(file.indexOf('.') + 1);
		if (ext != 'js' && ext != 'css' && ext != 'html') continue; // Mainly to exlude the placeholder remove-me.txt.

		var name = file.substring(0, file.indexOf('.'));
		if (pages.indexOf(name) === -1) pages.push(name);
	}

	pages.sort();
	return pages;
}

var emitter = {
	emitStat: emitStat
};

function loadDatasources (config, emitter) {
	var files = fs.readdirSync(datasourcesPath);
	var loadedCount = 0;
	for (var i = 0; i < files.length; i++) {
		var file = files[i];
		if (file.indexOf('.js') < 0) continue; // Only look for .js files (mainly in case the placeholder remove-me.txt still exists).

		var module = file.substring(0, file.indexOf('.'));

		var datasourceConfig = (config.datasource ? config.datasource[module] : {}) || {};
		require(datasourcesPath + '/' + module).start(datasourceConfig, emitter);
		log.debug('Loaded datasource module [' + module + ']' + (common.isEmptyObject(datasourceConfig) ? ' (no configuration found)' : ''));
		loadedCount++;
	}

	log.debug('Loaded ' + loadedCount + ' datasource modules' + (loadedCount === 0 ? ', maybe you should define one in [' + datasourcesPath + ']' : ''));
}

loadDatasources(config, emitter);
