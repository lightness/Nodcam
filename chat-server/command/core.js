var _ = require("lodash");

var commands = require("./commands");
var ALL_COMMANDS = require("./all");
var getIP = require("../util/get-ip");


function processCommand(command, ws) {
    let parts = getParts(command);

    let commandData = {
        raw: command,
        parts: parts,
        command: parts[0].slice(1),
        socket: ws,
        ip: getIP(ws)
    };

    let applicableHandlers = _.filter(commands, c => c.isApplicable(commandData));

    if (_.isEmpty(applicableHandlers)) {
        throw new Error("Wrong command. Type `/help` for more info");
    }

    if (applicableHandlers.length > 1) {
        throw new Error("Multiple handlers found.");
    }

    if (_.isFunction(applicableHandlers[0].validate)) {
        applicableHandlers[0].validate(commandData);
    }

    return applicableHandlers[0].handle(commandData);

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
