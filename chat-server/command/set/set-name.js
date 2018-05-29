var getIP = require("../../util/get-ip");
var getHash = require("../../util/get-hash");
var setHash = require("../../util/set-hash");


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

module.exports = setUserName;
