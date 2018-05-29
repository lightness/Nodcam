function getIP(ws) {
    return ws._socket.remoteAddress;
}

module.exports = getIP;
