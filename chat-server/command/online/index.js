var wss = require("../../web-socket-server");
var getIP = require("../../util/get-ip");
var resolveName = require("../../util/resolve-name");


function commandOnline() {
    let ips = getIpOfOnlineUsers();

    return Promise.all(ips.map(ip => resolveName(ip)))
        .then(namesOfIps => "Online users: " + namesOfIps.join(", "));
}

function getIpOfOnlineUsers() {
    return wss.clients.map(client => getIP(client));
}

module.exports = commandOnline;
