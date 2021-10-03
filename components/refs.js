const fs = require('fs-extra');
const chalk = require('chalk');
const path = require('path');
const { getFileIdFromPath } = require('./file');

const refListPath = path.join(__dirname, '../refList.json');

// const foundReferenceCallback = (file, matches, searchTerm, refList) => {
//     let alteredRefList = false;
//     let refMatch = null;
//     Array.from(matches || []).forEach(match => {
//         const dataFromMatchIndex = file.data.slice(match.index);
//         const backtickMatchesRaw = dataFromMatchIndex.matchAll(/```/g);
//         const backtickMatches = Array.from(backtickMatchesRaw);
//         if (!backtickMatches.length) return;
//         // Log the data between the first two matches
//         const start = backtickMatches[0].index;
//         const end = backtickMatches[1] ? backtickMatches[1].index : undefined;
//         const refInfo = dataFromMatchIndex.slice(start + 3, end).trim();

//         // Get the name of the ref
//         const refName = searchTerm.replace('ref:', '');

//         const descriptionRegex = new RegExp(`${match[0]}\((.*)\)`);
//         const refDescriptionMatch = dataFromMatchIndex.match(descriptionRegex);
//         const refDescription = refDescriptionMatch ? refDescriptionMatch[1].slice(1, refDescriptionMatch[1].length - 1) : '';
//         if (!refList) {
//             refList = {};
//             alteredRefList = true;
//         }
//         if (!refList[refName]) {
//             refList[refName] = {
//                 description: refDescription
//             };
//             alteredRefList = true;
//         }
//         const fileId = getFileIdFromPath(file.directory);
//         console.log(chalk.bold.blueBright(fileId));
//         console.log(refInfo);
//         refMatch = file.directory;
//     });
//     if (alteredRefList) {
//         fs.writeFileSync(refListPath, JSON.stringify(refList, null, 4));
//     }
//     return refMatch;
// }

const getRefList = () => {
    fs.ensureFileSync(refListPath);
    const refListData = fs.readFileSync(refListPath).toString();
    return refListData ? JSON.parse(refListData) : {};
}


const getRefValue = (refMatch, fileData) => {
    const dataFromMatchIndex = fileData.slice(refMatch.index);
    const backtickMatchesRaw = dataFromMatchIndex.matchAll(/```/g);
    const backtickMatches = Array.from(backtickMatchesRaw);
    if (!backtickMatches.length) return "";
    // Log the data between the first two matches
    const start = backtickMatches[0].index;
    const end = backtickMatches[1] ? backtickMatches[1].index : undefined;
    return dataFromMatchIndex.slice(start + 3, end).trim();
}


const getRefNameFromMatch = (refMatch, fileData, refPath) => {
    const regex = /\((.*)\)/;
    const refNameAndDesc = refMatch.replace('ref:', '').trim();
    const refName = refNameAndDesc.replace(regex, '');
    const refDescriptionMatch = refNameAndDesc.match(regex);
    const refDescription = refDescriptionMatch ? refDescriptionMatch[1] : '';
    const value = getRefValue(refMatch, fileData);
    return { name: refName, description: refDescription, value, path: refPath };
}

const addRefForRefNames = (ref, refList, refListPath, refStat) => {
    refList[ref.name] = {
        description: ref.description,
        path: refListPath,
        value: ref.value,
        pathModified: refStat.mtime
    }
}

const registerRefsFromNote = (notePath, noteDataBefore) => {
    const noteData = fs.readFileSync(notePath).toString();
    const noteStat = fs.statSync(notePath);
    const refList = getRefList();
    // Delete old refs if they have been removed
    const refRegex = /ref:(.*)[\(\n]/g
    // Before change
    const allBeforeRefs = noteDataBefore.match(refRegex) || [];
    const refNamesBefore = allBeforeRefs.map(refMatch => getRefNameFromMatch(refMatch, noteData, notePath));
    // After change
    const allAfterRefs = noteData.match(refRegex) || [];
    const refNamesAfter = allAfterRefs.map(refMatch => getRefNameFromMatch(refMatch, noteData, notePath));

    // Get added and deleted refs
    const addedRefs = refNamesAfter.filter(ref => {
        return !refNamesBefore.find(beforeRef => {
            return beforeRef.name === ref.name
                && beforeRef.description === ref.description 
                && beforeRef.path === ref.path
                && beforeRef.value === ref.value
                && beforeRef.pathModified === ref.pathModified
        });
    });
    const deletedRefs = refNamesBefore.filter(ref => {
        return !refNamesAfter.find(afterRef => {
            return afterRef.name === ref.name 
                && afterRef.description === ref.description 
                && afterRef.path === ref.path
                && afterRef.value === ref.value
                && afterRef.pathModified === ref.pathModified
        });
    });
    // Add the added refs
    addedRefs.forEach(ref => addRefForRefNames(ref, refList, refListPath, noteStat));
    // Delete the deleted refs
    deletedRefs.forEach(ref => { delete refList[ref.name] });
    // Add any refs that weren't previously added
    refNamesAfter.forEach(ref => addRefForRefNames(ref, refList, refListPath, noteStat));
    fs.writeFileSync(refListPath, JSON.stringify(refList, null, 4));
}

module.exports = {
    getRefList,
    getRefNameFromMatch,
    registerRefsFromNote
}