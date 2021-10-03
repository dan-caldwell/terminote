const fs = require('fs-extra');
const Utils = require('./Utils');

class Path {
    static updateNotes = (notePath = true) => {
        const configPath = Utils.configPath;
        fs.ensureFileSync(configPath);
        const config = Utils.getConfig();
        // Set the config path
        config.path = typeof notePath === "string" ? notePath : process.cwd();
        fs.writeFileSync(configPath, JSON.stringify(config, null, 4));
        console.log('Updated note path:', config.path);
    }
}

module.exports = Path;