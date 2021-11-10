const fs = require('fs-extra');
const Utils = require('./Utils');
const Log = require('./Log');

class Preview {

    static note = rawNotePath => {
        Utils.notePathExists(rawNotePath);
        const notePath = Utils.createNotePath(rawNotePath, false);
        const isDir = fs.statSync(notePath).isDirectory();
        if (isDir) {
            Log.red('Note path is a directory');
            process.exit(1);
        }
        const exists = fs.existsSync(notePath);
        if (!exists) {
            Log.red('Note path does not exist');
            process.exit(1);
        }
        const content = fs.readFileSync(notePath, 'utf-8').trim();
        const length = notePath.length;
        Log.preview(content, length, notePath);
    }

}

module.exports = Preview;