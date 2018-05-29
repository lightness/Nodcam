var getIP = require("../../util/get-ip");
var getHash = require("../../util/get-hash");
var setHash = require("../../util/set-hash");


function SetNameCommand() { }

SetNameCommand.prototype.isApplicable = function (commandData) {
    return commandData.command === "set" && commandData.parts[1] === "name";
}

SetNameCommand.prototype.validate = function(commandData) {
    if (commandData.parts.length !== 3) {
        throw new Error("Wrong command. Type `/help set` for more info");
    }
}

SetNameCommand.prototype.handle = function (commandData) {
    let ip = commandData.ip;
    let name = commandData.parts[2];
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

module.exports = new SetNameCommand();
