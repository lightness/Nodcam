var ALL_COMMANDS = require("../all");


function commandHelp(parts) {
    if (parts.length === 1) {
        return Object.keys(ALL_COMMANDS).reduce(function (acc, key) {
            return acc + "/" + key + " - " + ALL_COMMANDS[key].message + "\n";
        }, "");
    } else if (parts.length === 2) {
        if (Object.keys(ALL_COMMANDS).indexOf(parts[1]) > -1) {
            let msg = "Command `" + parts[1] + "`.\n" + ALL_COMMANDS[parts[1]].message;

            if (ALL_COMMANDS[parts[1]].children && Object.keys(ALL_COMMANDS[parts[1]].children).length) {
                msg += "\n\nSee also:\n" + Object.keys(ALL_COMMANDS[parts[1]].children).reduce(function (acc, key) {
                    return parts[0] + " " + parts[1] + " " + key
                }, "");
            }

            return msg;
        } else {
            throw Error("Wrong command. Type `/help` for more info");
        }
    } else if (parts.length === 3) {
        let command = ALL_COMMANDS[parts[1]];

        if (!command) {
            // throw error
        }

        let subCommand = command[parts[2]];

        if (!subCommand) {
            // throw error
        }

        return "Command `" + parts[1] + " " + parts[2] + "`.\n" + ALL_COMMANDS[parts[1]].children[parts[2]].message;
    } else {
        throw Error("Wrong command. Type `/help` for more info");
    }
}

module.exports = commandHelp;
