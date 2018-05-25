var express = require('express');
var WebSocket = require('ws');


if (!String.prototype.startsWith) {
  Object.defineProperty(String.prototype, 'startsWith', {
    enumerable: false,
    configurable: false,
    writable: false,
    value: function(searchString, position) {
      position = position || 0;
      return this.indexOf(searchString, position) === position;
    }
  });
}


const API_PORT = 3000;
const CHAT_PORT = 3070;

var app = express();

app.use('/public', express.static('public'));

app.get('/', function(req, res){
    res.sendFile('./index.html', {root: __dirname});
});

app.listen(API_PORT, function(){
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
	    broadcast(ip, message);		
    }

  });
 
  ws.on('close', function(code, message){
	console.log( 'Disconnected WebSocket '+ ip +' ('+wss.clients.length+' total)' );
  });

  console.log( 'New WebSocket Connection '+ ip +' ('+wss.clients.length+' total)' );
});

function processCommand(command, ws) {
	if (command == "/help") {
		return "/help - Help\n/online - Online users";
	} else if (command == "/online") {
		return "Online users: " + wss.clients.map(function(client) {
			var clientIP = client._socket.remoteAddress;

			return clientIP === "127.0.0.1" ? "Admin" : clientIP;
		}).join(", ");
	} else if (command.startsWith("/history")) {
		let parts = command.split(" ");

		if (parts.length !== 3 || !isNumeric(parts[1]) || !isNumeric(parts[2]) ) {
			throw Error("Wrong command. Type `/help history` for more info");
		}

		return getHistory(parseFloat(parts[1]), parseFloat(parts[2]), getIP(ws));
	}


	else {
		throw Error("Wrong command. Type `/help` for more info");
	}
}

function sendTo(fromWho, what, toWs, options) {
	let msg = JSON.stringify({
    	user: fromWho,
    	message: what,
    	date: new Date()
    })

	if (!options || !options.skipHistory){
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
	console.log("messages:"+ip, from, to);

	return new Promise(function (resolve) {
		redisClient.lrange("messages:"+ip, from, to, (e, data) => {
			console.log(">>>", data);

			resolve(data);
		});
	});
}