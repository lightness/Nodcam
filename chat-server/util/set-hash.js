var redisClient = require("../redis");


function setHash(hash, key, value) {
    return new Promise(function (resolve) {
        redisClient.hset(hash, key, value, (e, data) => {
            resolve(data);
        });
    });
}

module.exports = setHash;
