const ALL_COMMANDS = {
    "help": { message: "Shows this help" },
    "online": { message: "Provides list of online users" },
    "set": {
        message: "Sets some property. See detailed reference",
        children: {
            "name": { message: "Sets user name. Name will be visible for all users." }
        }
    },
};

module.exports = ALL_COMMANDS;
