const fs = require('fs-extra');
const Utils = require('./Utils');
const Log = require('./Log');

class Preview {
    static note = async (prevDateNum, isFileId = false) => {
        const date = isFileId ? prevDateNum : Utils.previousDate(prevDateNum);
        const notePath = await Utils.notePathFromDate(date);
        const file = fs.readFileSync(notePath);
        const str = file.toString();
        const len = notePath.length;
        // Cat wasn't working so I'm just console.logging the file
        Log.preview(str.trim(), len, notePath);
    }

}

module.exports = Preview;