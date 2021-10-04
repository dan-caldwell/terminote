const path = require('path');
const fs = require('fs-extra');
const chalk = require('chalk');
const Log = require('./Log');
const Utils = require('./Utils');

class Ref {

    // refList.json path
    static listPath = path.join(__dirname, '../refList.json');

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
        const refNameAndDesc = refMatch.replace('ref:', '').trim();
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
    static updateRefOnList = (ref, refList, notePath, noteStat) => [
        refList[ref.name] = {
            description: ref.description,
            path: notePath,
            value: ref.value,
            pathModified: noteStat.mtime
        }
    ]

    // On closing a note, this is the callback that will register/update refs from the note
    static updateFromNote = (notePath, noteDataBefore) => {
        const noteData = fs.readFileSync(notePath).toString();
        const noteStat = fs.statSync(notePath);
        const refList = this.getList();

        // Regex that will capture a ref
        const refRegex = /ref:(.*)[\(\n]/g;
        // Before change
        const allBeforeRefs = noteDataBefore.match(refRegex) || [];
        const refNamesBefore = allBeforeRefs.map(refMatch => this.infoFromMatch(refMatch, noteData));
        // After change
        const allAfterRefs = noteData.match(refRegex) || [];
        const refNamesAfter = allAfterRefs.map(refMatch => this.infoFromMatch(refMatch, noteData));

        // Get deleted refs
        const deletedRefs = refNamesBefore.filter(ref => {
            return !refNamesAfter.find(afterRef => this.isEqualObject(afterRef, ref));
        });
        // Delete the deleted refs
        deletedRefs.forEach(ref => { delete refList[ref.name] });
        // Add/update the found refs
        refNamesAfter.forEach(ref => this.updateRefOnList(ref, refList, notePath, noteStat));
        fs.writeFileSync(this.listPath, JSON.stringify(refList, null, 4));
    }

    // Check if two objects have the same values
    static isEqualObject = (obj1, obj2) => {
        for(const key in obj1){
            if (!(key in obj2)) return false;
            if (obj1[key] !== obj2[key]) return false;
        }
        return true;
    }
}

module.exports = Ref;