var redis = require("redis");


var redisClient = redis.createClient();

redisClient.on("error", function (err) {
    console.log("Redis Error: " + err);
});

module.exports = redisClient;
