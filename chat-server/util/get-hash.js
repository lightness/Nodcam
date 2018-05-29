var redisClient = require("../redis");


function getHash(hash, key) {
    return new Promise(function (resolve) {
        redisClient.hget(hash, key, (e, data) => {
            resolve(data);
        });
    });
}

module.exports = getHash;