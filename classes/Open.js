const Utils = require('./Utils');
const Preview = require('./Preview');
const Ref = require('./Ref');

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

    static date = async (prevDateNum, isFileId) => {
        const date = isFileId ? prevDateNum : Utils.previousDate(prevDateNum);
        // Initialize note
        const { currentNote, notePath, noteDataBefore } = await Utils.newNote(date);
        // Register new refs
        currentNote.on('close', () => Ref.updateFromNote(notePath, noteDataBefore));
    }
}

module.exports = Open;