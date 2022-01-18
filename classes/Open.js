const Utils = require('./Utils');
const Preview = require('./Preview');
const fs = require('fs-extra');
const { spawn } = require('child_process');
const Log = require('./Log');

class Open {
    
    static notesFolder = () => {
        const config = Utils.getConfig();
        spawn('open', [config.path]);
    }

    static notePath = rawNotePath => {
        const dirPath = Utils.createNoteDirPath(rawNotePath, false);
        const isDir = fs.lstatSync(dirPath).isDirectory();
        if (!isDir) {
            Log.red('The path you specified is not a folder.');
        } else {
            spawn('open', [dirPath]);
        }
        process.exit(1);
    }
}

module.exports = Open;