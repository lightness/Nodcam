var WebSocket = require('ws');
var redis = require("redis");
var _ = require("lodash");

var getIP = require("./util/get-ip");
var resolveName = require("./util/resolve-name");
var redisClient = require("./redis");
var processCommand = require("./command/core");
var wss = require("./web-socket-server");


wss.on('connection', function (ws) {
    var ip = getIP(ws);

    ws.on('message', function (message) {
        console.log('[%s] %s ', ip, message);

        if (message[0] === '/') {
            let result;
            let skipHistory = _.startsWith(message, "/history");

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
            resolveName(ip)
                .then(function (name) {
                    broadcast(name, message);
                })
                .catch(e => console.error(e));
        }

    });

    ws.on('close', function (code, message) {
        console.log('Disconnected WebSocket ' + ip + ' (' + wss.clients.length + ' total)');
    });

    console.log('New WebSocket Connection ' + ip + ' (' + wss.clients.length + ' total)');
});

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
