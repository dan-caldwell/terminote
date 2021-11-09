const fs = require('fs-extra');
const Utils = require('./Utils');
const Log = require('./Log');

class Preview {
    static note = async (prevDateNum, isFileId = false) => {
        const date = isFileId ? prevDateNum : Utils.previousDate(prevDateNum);
        const notePath = Utils.notePathFromDate(date);
        const file = fs.readFileSync(notePath);
        const str = file.toString();
        const len = notePath.length;
        // Log the contents of the file
        Log.preview(str.trim(), len, notePath);
    }

    static listOfNotes = async (numNotes) => {
        for (let i = numNotes; i >= 0; i--) {
            await this.note(-i);
        }
    }

}

module.exports = Preview;