var _ = require("lodash");

var commands = require("./commands");
var ALL_COMMANDS = require("./all");
var getIP = require("../util/get-ip");


var numberRegex = /^[-+]?\d+$/

// TODO: Refactor
function processCommand(command, ws) {
    let parts = getParts(command);

    if (parts[0] === "/help") {
        return commands.help(parts);
    } else if (parts[0] === "/online") {
        return commands.online();
    } else if (parts[0] === "/history") {
        if (parts.length !== 3 || !numberRegex.test(parts[1]) || !numberRegex.test(parts[2])) {
            throw Error("Wrong command. Type `/help history` for more info");
        }

        return commands.history(parseInt(parts[1]), parseInt(parts[2]), getIP(ws));
    } else if (_.startsWith(command, "/set name")) {
        if (parts.length !== 3) {
            throw Error("Wrong command. Type `/help set` for more info");
        }

        return commands.set(parts[1])(unescape(parts[2]), ws);
    } else {
        throw Error("Wrong command. Type `/help` for more info");
    }

    function getParts(command) {
        let parts = command.match(/[^\s"]+|"[^"]*"/g);

        return parts.map(part => unescape(part));
    }

    function unescape(escaped) {
        let matches = escaped.match(/^"(.*)"$/);

        return matches ? matches[1] : escaped;
    }
}

module.exports = processCommand;
