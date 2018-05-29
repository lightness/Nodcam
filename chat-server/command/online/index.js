var wss = require("../../web-socket-server");
var getIP = require("../../util/get-ip");
var resolveName = require("../../util/resolve-name");


function OnlineCommand(wss) {
    this.wss = wss;
}

OnlineCommand.prototype.isApplicable = function (commandData) {
    return commandData.command === "online";
}

OnlineCommand.prototype.handle = function (commandData) {
    let ips = this.getIpOfOnlineUsers();

    return Promise.all(ips.map(ip => resolveName(ip)))
        .then(namesOfIps => "Online users: " + namesOfIps.join(", "));
}

OnlineCommand.prototype.getIpOfOnlineUsers = function () {
    return this.wss.clients.map(client => getIP(client));
}

module.exports = new OnlineCommand(wss);
