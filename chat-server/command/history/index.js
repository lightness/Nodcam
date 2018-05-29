var redisClient = require("../../redis");


function HistoryCommand(redis) {
    this.redis = redis;
}

HistoryCommand.prototype.isApplicable = function (commandData) {
    return commandData.command === "history";
}

HistoryCommand.prototype.validate = function (commandData) {
    var numberRegex = /^[-+]?\d+$/;
    var parts = commandData.parts;

    if (parts.length !== 3 || !numberRegex.test(parts[1]) || !numberRegex.test(parts[2])) {
        throw Error("Wrong command. Type `/help history` for more info");
    }
}

HistoryCommand.prototype.handle = function (commandData) {
    let ip = commandData.ip;
    let from = commandData.parts[1];
    let to = commandData.parts[2];

    return new Promise((resolve) => {
        this.redis.lrange("messages:" + ip, from, to, (e, data) => {
            resolve(data);
        });
    });
}

module.exports = new HistoryCommand(redisClient);
