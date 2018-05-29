var WebSocket = require('ws');


const CHAT_PORT = 3070;

const wss = new WebSocket.Server({ port: CHAT_PORT });

module.exports = wss;
