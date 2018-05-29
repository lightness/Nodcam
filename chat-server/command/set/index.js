var setName = require("./set-name");


function pickHandler(property) {
    switch (property) {
        case "name":
            return setName;
        default:
            throw new Error("Wrong command. Type `/help set` for more info");
    }
}

module.exports = pickHandler;
