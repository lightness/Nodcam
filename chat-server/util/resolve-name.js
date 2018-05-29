var getHash = require("./get-hash");


function resolveName(ip) {
    return getHash("ip:to:name", ip)
        .then(name => name || (ip === "127.0.0.1" ? "Admin" : ip));
}

module.exports = resolveName;
