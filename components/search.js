const chalk = require('chalk');
const { logNotePathHeader } = require('./log');
const { getAllFilesInDir, getConfig } = require('./file');
const { getRefList } = require('./refs');

const searchNote = ({ file, searchTerm, refList, matchCallback }) => {
    const includes = file.data.includes(searchTerm);
    if (!includes) {
        return matchCallback(file, includes, searchTerm, refList);
    }
    const regex = new RegExp(searchTerm, 'gi');
    const rawMatches = file.data.matchAll(regex);
    if (!rawMatches) {
        return matchCallback(file, rawMatches, searchTerm, refList);
    }
    const matches = Array.from(rawMatches);
    return matchCallback(file, matches, searchTerm, refList);
}

const searchNotes = (searchTerm, matchCallback) => {
    const config = getConfig();
    const refList = searchTerm.includes('ref:') ? getRefList() : null;
    const files = getAllFilesInDir(config.path);
    const foundFiles = [];
    files.forEach(file => {
        const foundDirectory = searchNote({ file, searchTerm, refList, matchCallback });
        if (foundDirectory) foundFiles.push(foundDirectory);
    });
    return foundFiles;
}

const foundNotesCallback = (file, matches, searchTerm) => {
    if (!matches) return;
    logNotePathHeader(file.directory, file.directory.length);
    matches.forEach(match => {
        const padding = 100;
        const start = match.index - padding > 0 ? match.index - padding : 0;
        const end = match.index + padding;
        const textSlice = file.data.slice(start, end);
        console.log(chalk.greenBright('–').repeat(file.directory.length));
        console.log(textSlice.replace(regex, chalk.bgYellowBright.black(searchTerm)));
        console.log(chalk.greenBright('–').repeat(file.directory.length));
    });
}

module.exports = {
    searchNote,
    searchNotes,
    foundNotesCallback
}