const fs = require('fs-extra');
const chalk = require('chalk');
const path = require('path');
const { getFileIdFromPath } = require('./file');

const refListPath = path.join(__dirname, '../refList.json');

const foundReferenceCallback = (file, matches, searchTerm, refList) => {
    let alteredRefList = false;
    let refMatch = null;
    Array.from(matches || []).forEach(match => {
        const dataFromMatchIndex = file.data.slice(match.index);
        const backtickMatchesRaw = dataFromMatchIndex.matchAll(/```/g);
        const backtickMatches = Array.from(backtickMatchesRaw);
        if (!backtickMatches.length) return;
        // Log the data between the first two matches
        const start = backtickMatches[0].index;
        const end = backtickMatches[1] ? backtickMatches[1].index : undefined;
        const refInfo = dataFromMatchIndex.slice(start + 3, end).trim();

        // Get the name of the ref
        const refName = searchTerm.replace('ref:', '');

        const descriptionRegex = new RegExp(`${match[0]}\((.*)\)`);
        const refDescriptionMatch = dataFromMatchIndex.match(descriptionRegex);
        const refDescription = refDescriptionMatch ? refDescriptionMatch[1].slice(1, refDescriptionMatch[1].length - 1) : '';
        if (!refList) {
            refList = {};
            alteredRefList = true;
        }
        if (!refList[refName]) {
            refList[refName] = refDescription;
            alteredRefList = true;
        }
        const fileId = getFileIdFromPath(file.directory);
        console.log(chalk.bold.blueBright(fileId));
        console.log(refInfo);
        refMatch = file.directory;
    });
    if (alteredRefList) {
        fs.writeFileSync(refListPath, JSON.stringify(refList, null, 4));
    }
    return refMatch;
}

const getRefList = () => {
    fs.ensureFileSync(refListPath);
    const refListData = fs.readFileSync(refListPath).toString();
    return refListData ? JSON.parse(refListData) : {};
}


const getRefNameFromMatch = (refMatch) => {
    const regex = /\((.*)\)/;
    const refNameAndDesc = refMatch.replace('ref:', '').trim();
    const refName = refNameAndDesc.replace(regex, '');
    const refDescriptionMatch = refNameAndDesc.match(regex);
    const refDescription = refDescriptionMatch ? refDescriptionMatch[1] : '';
    return {name: refName, description: refDescription};
}

const registerRefsFromNote = (notePath, noteDataBefore) => {
    const noteData = fs.readFileSync(notePath).toString();
    const refList = getRefList();
    // Delete old refs if they have been removed
    const refRegex = /ref:(.*)[\(\n]/g
    // Before change
    const allBeforeRefs = noteDataBefore.match(refRegex) || [];
    const refNamesBefore = allBeforeRefs.map(getRefNameFromMatch);
    // After change
    const allAfterRefs = noteData.match(refRegex) || [];
    const refNamesAfter = allAfterRefs.map(getRefNameFromMatch);

    // Get added and deleted refs
    const addedRefs = refNamesAfter.filter(ref => !refNamesBefore.find(beforeRef => beforeRef.name === ref.name && beforeRef.description === ref.description));
    const deletedRefs = refNamesBefore.filter(ref => !refNamesAfter.find(afterRef => afterRef.name === ref.name && afterRef.description === ref.description));
    // Add the added refs
    addedRefs.forEach(ref => { refList[ref.name] = ref.description });
    // Delete the deleted refs
    deletedRefs.forEach(ref => { delete refList[ref.name] });
    // Add any refs that weren't previously added
    refNamesAfter.forEach(ref => { refList[ref.name] = ref.description });
    fs.writeFileSync(refListPath, JSON.stringify(refList, null, 4));
}

module.exports = {
    foundReferenceCallback,
    getRefList,
    getRefNameFromMatch,
    registerRefsFromNote
}