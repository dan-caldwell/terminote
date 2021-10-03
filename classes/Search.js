const Utils = require('./Utils');
const Log = require('./Log');
const chalk = require('chalk');

class Search {

    // Search all notes, return all matches with file info
    static notes = (searchTerm, deep = true, withData = true) => {
        const config = Utils.getConfig();
        const files = Utils.getAllFilesInDir(config.path, deep, withData);
        const foundFiles = [];
        files.forEach(file => {
            const found = this.note({ file, searchTerm });
            if (found) foundFiles.push({
                matches: found,
                searchTerm,
                file
            });
        });
        return foundFiles;
    }

    // Search a single note, return matches
    static note = ({ file, searchTerm }) => {
        const includes = file.data.includes(searchTerm);
        if (!includes) return null;
        const regex = new RegExp(searchTerm, 'gi');
        const rawMatches = file.data.matchAll(regex);
        if (!rawMatches) return null;
        const matches = Array.from(rawMatches);
        return matches;
    }

    // Search all notes and log the results that were found
    static allAndLogResults = (searchTerm) => {
        const foundFiles = this.notes(searchTerm);
        if (!foundFiles.length) Log.red('No results found');
        const padding = 100;
        const regex = new RegExp(searchTerm, 'gi');
        foundFiles.forEach(foundFile => {
            const file = foundFile.file;
            Log.pathHeader(file.directory, file.directory.length);
            foundFile.matches.forEach(match => {
                const start = match.index - padding > 0 ? match.index - padding : 0;
                const end = match.index + padding;
                const textSlice = file.data.slice(start, end);
                const divider = '–'.repeat(file.directory.length);
                Log.green(divider);
                console.log(textSlice.replace(regex, chalk.bgYellowBright.black(searchTerm)));
                Log.green(divider);
            });
        });
    }
}

module.exports = Search;