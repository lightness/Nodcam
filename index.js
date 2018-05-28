var express = require('express');
var WebSocket = require('ws');


if (!String.prototype.startsWith) {
	Object.defineProperty(String.prototype, 'startsWith', {
		enumerable: false,
		configurable: false,
		writable: false,
		value: function (searchString, position) {
			position = position || 0;
			return this.indexOf(searchString, position) === position;
		}
	});
}


const API_PORT = 3000;
const CHAT_PORT = 3070;

var app = express();

app.use('/public', express.static('public'));

app.get('/', function (req, res) {
	res.sendFile('./index.html', { root: __dirname });
});

app.listen(API_PORT, function () {
	console.log('App listening on port 3000!')
});



var redis = require("redis"),
	redisClient = redis.createClient();

redisClient.on("error", function (err) {
	console.log("Error " + err);
});



const wss = new WebSocket.Server({ port: CHAT_PORT });

wss.on('connection', function connection(ws) {
	var ip = getIP(ws);

	ws.on('message', function incoming(message) {
		console.log('[%s] %s ', ip, message);

		if (message[0] === '/') {
			let result;
			let skipHistory = message.startsWith("/history");

			try {
				result = processCommand(message, ws);

				Promise.resolve(result)
					.then(function (resolvedResult) {
						sendTo("System", resolvedResult, ws, { skipHistory: skipHistory });
					});
			}
			catch (e) {
				sendTo("System", e.message, ws);
			}

		} else {
			getHash("ip:to:name", ip)
				.then(function (name) {
					broadcast(name || ip, message);
				});
		}

	});

	ws.on('close', function (code, message) {
		console.log('Disconnected WebSocket ' + ip + ' (' + wss.clients.length + ' total)');
	});

	console.log('New WebSocket Connection ' + ip + ' (' + wss.clients.length + ' total)');
});

const ALL_COMMANDS = {
	"help": { message: "Shows this help" },
	"online": { message: "Provides list of online users" },
	"set": {
		message: "Sets some property. See detailed reference",
		children: {
			"name": { message: "Sets user name. Name will be visible for all users." }
		}
	},
};

function processCommand(command, ws) {
	let parts = getParts(command);

	if (parts[0] === "/help") {
		return commandHelp(parts);
	} else if (parts[0] === "/online") {
		return commandOnline();
	} else if (parts[0] === "/history") {
		if (parts.length !== 3 || !isNumeric(parts[1]) || !isNumeric(parts[2])) {
			throw Error("Wrong command. Type `/help history` for more info");
		}

		return getHistory(parseFloat(parts[1]), parseFloat(parts[2]), getIP(ws));
	} else if (command.startsWith("/set name")) {
		if (parts.length !== 3) {
			throw Error("Wrong command. Type `/help set` for more info");
		}

		return setUserName(unescape(parts[2]), ws);
	} else {
		throw Error("Wrong command. Type `/help` for more info");
	}

	function getParts(command) {
		let parts = command.match(/[^\s"]+|"[^"]*"/g);

		return parts.map(part => unescape(part));
	}

	function unescape(escaped) {
		let matches = escaped.match(/^"(.*)"$/);

		return matches ? matches[1] : escaped;
	}

	function commandHelp(parts) {
		if (parts.length === 1) {
			return Object.keys(ALL_COMMANDS).reduce(function (acc, key) {
				return acc + "/" + key + " - " + ALL_COMMANDS[key].message + "\n";
			}, "");
		} else if (parts.length === 2) {
			if (Object.keys(ALL_COMMANDS).indexOf(parts[1]) > -1) {
				let msg = "Command `" + parts[1] + "`.\n" + ALL_COMMANDS[parts[1]].message;

				if (ALL_COMMANDS[parts[1]].children && Object.keys(ALL_COMMANDS[parts[1]].children).length) {
					msg += "\n\nSee also:\n" + Object.keys(ALL_COMMANDS[parts[1]].children).reduce(function (acc, key) {
						return parts[0] + " " + parts[1] + " " + key
					}, "");
				}

				return msg;
			} else {
				throw Error("Wrong command. Type `/help` for more info");
			}
		} else if (parts.length === 3) {
			let command = ALL_COMMANDS[parts[1]];

			if (!command) {
				// throw error
			}

			let subCommand = command[parts[2]];

			if (!subCommand) {
				// throw error
			}

			return "Command `" + parts[1] + " " + parts[2] + "`.\n" + ALL_COMMANDS[parts[1]].children[parts[2]].message;
		} else {
			throw Error("Wrong command. Type `/help` for more info");
		}
	}
}

function sendTo(fromWho, what, toWs, options) {
	let msg = JSON.stringify({
		user: fromWho,
		message: what,
		date: new Date()
	})

	if (!options || !options.skipHistory) {
		redisClient.rpush("messages:" + getIP(toWs), msg, redis.print);
	}

	toWs.send(msg);
}

function broadcast(fromWho, what) {
	wss.clients.forEach(function (client) {
		if (client.readyState === WebSocket.OPEN) {
			sendTo(fromWho, what, client);
		}
	});
};

function getIP(ws) {
	return ws._socket.remoteAddress;
}

function isNumeric(n) {
	return !isNaN(parseFloat(n)) && isFinite(n);
}

function getHistory(from, to, ip) {
	console.log("messages:" + ip, from, to);

	return new Promise(function (resolve) {
		redisClient.lrange("messages:" + ip, from, to, (e, data) => {
			resolve(data);
		});
	});
}

function getIpOfOnlineUsers() {
	return wss.clients.map(client => getIP(client));
}

function commandOnline() {
	let ips = getIpOfOnlineUsers();

	return Promise.all(ips.map(ip => resolveName(ip)))
		.then(namesOfIps => "Online users: " + namesOfIps.join(", "));
}

function setUserName(name, ws) {
	let ip = getIP(ws);
	let error = new Error("Name is already obtained by another user");

	return getHash("name:to:ip", name)
		.then(function (foundIp) {
			if (foundIp) {
				if (ip === foundIp) {
					return;
				} else {
					throw error;
				}
			}

			return setHash("name:to:ip", name, ip);
		})
		.then(function () {
			return setHash("ip:to:name", ip, name);
		})
		.then(function () {
			return "Now your name is " + name;
		})
		.catch(function (e) {
			console.error(e);

			return e === error ? e.message : "Something went wrong";
		});
}

function getHash(hash, key) {
	return new Promise(function (resolve) {
		redisClient.hget(hash, key, (e, data) => {
			resolve(data);
		});
	});
}

function setHash(hash, key, value) {
	return new Promise(function (resolve) {
		redisClient.hset(hash, key, value, (e, data) => {
			resolve(data);
		});
	});
}

function resolveName(ip) {
	return getHash("ip:to:name", ip)
		.then(name => name || (ip === "127.0.0.1" ? "Admin" : ip));
}
