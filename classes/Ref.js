const path = require('path');
const fs = require('fs-extra');
const chalk = require('chalk');
const Log = require('./Log');
const Search = require('./Search');
const Utils = require('./Utils');

class Ref {

    // refList.json path
    static listPath = path.join(__dirname, '../refList.json');

    // Capture a ref
    static captureRegex = /ref:(.*)[\(\n]/g;

    // Gets the ref list from refList.json
    static getList = () => {
        fs.ensureFileSync(this.listPath);
        const refListData = fs.readFileSync(this.listPath).toString();
        return refListData ? JSON.parse(refListData) : {};
    }

    // Lists all refs and descriptions
    static list = () => {
        const refList = this.getList();
        const entries = Object.entries(refList);
        entries.forEach(entry => {
            const key = entry[0];
            const desc = entry[1]?.description ? ` - ${entry[1].description}` : '';
            Log.keyValue(key, desc, 'greenBright', 'yellow');
        });
    }

    // View all refs
    static view = () => {
        const refList = this.getList();
        const entries = Object.entries(refList);
        entries.forEach(entry => {
            const key = entry[0];
            const desc = entry[1]?.description ? ` - ${entry[1].description}` : '';
            Log.keyValue(key, desc, 'greenBright', 'yellow');
            // Log the ref value from the file
            console.log(entry[1]?.value || '');
            console.log(chalk.greenBright('–'.repeat(30)));
        });
    }

    // Gets the ref's value from a match
    static getValueFromMatch = (refMatch, fileData) => {
        const dataFromMatchIndex = fileData.slice(refMatch.index);
        const backtickMatchesRaw = dataFromMatchIndex.matchAll(/```/g);
        const backtickMatches = Array.from(backtickMatchesRaw);
        if (!backtickMatches.length) return "";
        const start = backtickMatches[0].index;
        const end = backtickMatches[1] ? backtickMatches[1].index : undefined;
        // Return data between found backticks
        return dataFromMatchIndex.slice(start + 3, end).trim();
    }

    // Get ref info from the match in the fileData
    static infoFromMatch = (refMatch, fileData) => {
        // Regex to get the ref name and description
        const regex = /\((.*)\)/;
        const refNameAndDesc = refMatch[0].replace('ref:', '').trim();
        const refName = refNameAndDesc.replace(regex, '');
        const refDescriptionMatch = refNameAndDesc.match(regex);
        const refDescription = refDescriptionMatch ? refDescriptionMatch[1] : '';
        const value = this.getValueFromMatch(refMatch, fileData);
        return { 
            name: refName, 
            description: refDescription, 
            value,
        };
    }

    // Adds/updates a ref on the refList
    static updateRefOnList = (ref, refList, notePath, noteStat) => {
        const newValue = {
            description: ref.description,
            path: notePath,
            value: ref.value,
            pathModified: noteStat.mtime.toString()
        }
        if (Utils.isEqualObject(refList[ref.name], newValue)) return false;
        refList[ref.name] = newValue;
        return true;
    }

    // On closing a note, this is the callback that will register/update refs from the note
    static updateFromNote = (notePath, noteDataBefore) => {
        const noteData = fs.readFileSync(notePath).toString();
        const noteStat = fs.statSync(notePath);
        const refList = this.getList();

        // Before change
        const allBeforeRefs = Array.from(noteDataBefore.matchAll(this.captureRegex)) || [];
        const refNamesBefore = allBeforeRefs.map(refMatch => this.infoFromMatch(refMatch, noteData));
        // After change
        const allAfterRefs = Array.from(noteData.matchAll(this.captureRegex)) || [];
        const refNamesAfter = allAfterRefs.map(refMatch => this.infoFromMatch(refMatch, noteData));

        // Get deleted refs
        const deletedRefs = refNamesBefore.filter(ref => {
            return !refNamesAfter.find(afterRef => Utils.isEqualObject(afterRef, ref));
        });
        // Delete the deleted refs
        deletedRefs.forEach(ref => { delete refList[ref.name] });
        // Add/update the found refs
        refNamesAfter.forEach(ref => this.updateRefOnList(ref, refList, notePath, noteStat));
        fs.writeFileSync(this.listPath, JSON.stringify(refList, null, 4));
    }

    // Register all refs
    static registerAll = () => {
        const foundRefs = Search.notes({ searchTerm: this.captureRegex, regexSearch: true });
        if (!foundRefs.length) Log.red('No refs found');
        const refList = this.getList();
        const nonUpdatedRefs = [];
        foundRefs.forEach(foundRef => {
            if (!foundRef.matches.length) return;
            const noteStat = fs.statSync(foundRef.file.directory);
            foundRef.matches.forEach(match => {
                const info = this.infoFromMatch(match, foundRef.file.data);
                const newRef = !refList[info.name];
                const hasUpdated = this.updateRefOnList(info, refList, foundRef.file.directory, noteStat);
                if (newRef) {
                    console.log(chalk.greenBright('Registered ref'), info.name);
                } else if (hasUpdated) {
                    console.log(chalk.magentaBright('Updated ref', info.name));
                } else {
                    nonUpdatedRefs.push(info);
                }
            });
        });
        if (nonUpdatedRefs.length) {
            Log.yellow('No refs to update');
        } else {
            fs.writeFileSync(this.listPath, JSON.stringify(refList, null, 4));
        }
    }

    // Get a single ref
    static get = (refName) => {
        const refList = this.getList();
        if (!refList[refName]) return null;
        return refList[refName];
    }


    // Log the contents of a ref
    static log = (refName) => {
        const ref = this.get(refName);
        if (!ref) return Log.red(`Ref ${refName} not found`);
        const refPathId = ref.path.split('/').pop().split('.').shift().split('-').slice(0, -1).join('-');
        const headLength = `(${refPathId})`.length + refName.length + `- ${ref.description}`.length + 2;
        const fullHead = [chalk.blueBright(`(${refPathId})`), chalk.greenBright.bold(refName), chalk.yellow.italic(`- ${ref.description}`)].join(' ');
        console.log(fullHead);
        console.log(chalk.blueBright('–'.repeat(headLength)));
        console.log(ref.value);
        console.log(chalk.blueBright('–'.repeat(headLength)));
    }

    static edit = (refName) => {
        const ref = this.get(refName);
        if (!ref) return Log.red(`Ref ${refName} not found`);
        const noteDataBefore = fs.readFileSync(ref.path).toString();
        const currentNote = Utils.openNote(ref.path);
        currentNote.on('close', () => this.updateFromNote(ref.path, noteDataBefore));
    }
}

module.exports = Ref;