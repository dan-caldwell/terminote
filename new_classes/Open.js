const Utils = require('./Utils');
const Preview = require('./Preview');
const { spawn } = require('child_process');

class Open {
    static notesFolder = () => {
        const config = Utils.getConfig();
        spawn('open', [config.path]);
    }

    static previousNote = (argv) => {
        const dateNum = argv._[0];
        const splitDateNum = typeof dateNum === "number" ? [] : dateNum.split('-');
        // Check if passing a file ID (date)
        const dateNumDate = new Date(dateNum);
        const year = dateNumDate.getFullYear();
        // Open the note at the date
        if (year > 2000 && splitDateNum.length === 3) {
            return argv.p ? Preview.note(dateNumDate, true) : this.date(dateNumDate, true);
        }
        if (typeof dateNum === "number" && dateNum < 0) {
            return argv.p ? Preview.note(dateNumDate) : this.date(dateNumDate);
        }
    }

    static date = (prevDateNum, isFileId) => {
        const date = isFileId ? prevDateNum : Utils.previousDate(prevDateNum);
        // Initialize note
        Utils.newNote(date);
    }
}

module.exports = Open;