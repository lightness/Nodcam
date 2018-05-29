var redisClient = require("../../redis");


function getHistory(from, to, ip) {
    console.log("messages:" + ip, from, to);

    return new Promise(function (resolve) {
        redisClient.lrange("messages:" + ip, from, to, (e, data) => {
            resolve(data);
        });
    });
}

module.exports = getHistory;
