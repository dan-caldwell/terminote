#!/usr/bin/env node
const { hideBin } = require('yargs/helpers');
const yargs = require('yargs/yargs');
const argv = yargs(hideBin(process.argv)).argv;
const path = require('path');
const fs = require('fs-extra');
const dateformat = require('./dateformat');
const { spawn } = require('child_process');
const chalk = require('chalk');

// Set the path to use the notes

const configPath = path.join(__dirname, './config.json');
const refListPath = path.join(__dirname, './refList.json');

const updateNotePath = (notePath = true) => {
    fs.ensureFileSync(configPath);
    const config = getConfig();
    // Set the config path
    config.path = typeof notePath === "string" ? notePath : process.cwd();
    fs.writeFileSync(configPath, JSON.stringify(config, null, 4));
    console.log('Updated note path:', config.path);
}

const getNotePathFromDate = async (dateObj) => {
    // Make sure config exists
    const pathExists = fs.pathExistsSync(configPath);
    if (!pathExists) updateNotePath();
    const config = getConfig();
    // Make a new txt file based on the day
    const date = dateformat(dateObj, 'yyyy-mm-dd-ddd');
    const notePath = config.path + '/' + date + '.txt';
    fs.ensureFileSync(notePath);
    return notePath;
}

const createNewNote = async (dateObj) => {
    const notePath = await getNotePathFromDate(dateObj);
    const noteDataBefore = fs.readFileSync(notePath).toString();
    const currentNote = spawn('nano', [notePath], {
        stdio: 'inherit'
    });
    // Register new refs
    currentNote.on('close', () => registerRefsFromNote(notePath, noteDataBefore));
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

const previousDate = (prevDateNum = 0) => {
    const date = new Date();
    date.setDate(date.getDate() - Math.abs(prevDateNum));
    return date;
}

const goToDate = (prevDateNum) => {
    const date = previousDate(prevDateNum);
    createNewNote(date);
}

const logNotePathHeader = (notePath, dividerLength) => {
    const divider = chalk.blueBright('▀'.repeat(dividerLength));
    console.log(chalk.blueBright('▄').repeat(dividerLength));
    console.log(chalk.blueBright.italic(notePath));
    console.log(divider);
}

const previewLog = (str, dividerLength, notePath, useColoredText = true) => {
    const mainText = useColoredText ? chalk.yellowBright(str.trim()) : str.trim();
    const divider = chalk.blueBright('▀'.repeat(dividerLength));
    logNotePathHeader(notePath, dividerLength);
    console.log(mainText);
    console.log(divider);
}

const previewNote = async (prevDateNum) => {
    const date = previousDate(prevDateNum);
    const notePath = await getNotePathFromDate(date);
    // Cat wasn't working so I'm just console.logging the file
    const file = fs.readFileSync(notePath);
    const str = file.toString();
    const len = notePath.length;
    previewLog(str.trim(), len, notePath);
}

const getConfig = () => {
    const configStr = fs.readFileSync(configPath).toString();
    return configStr ? JSON.parse(configStr) : { path: '' };
}

// Previews a previous amount of notes
const previewListOfNotes = async (numNotes) => {
    for (let i = numNotes; i >= 0; i--) {
        await previewNote(-i);
    }
}

const getAllFilesInDir = (dirPath, deep = true) => {
    const files = fs.readdirSync(dirPath);
    let arrayOfFiles = [];
    files.forEach(file => {
        const fullPath = dirPath + "/" + file;
        // Check if the full path exists
        const exists = fs.existsSync(fullPath);
        if (!exists) return console.log(chalk.redBright('File does not exist', fullPath));
        if (fs.statSync(fullPath).isDirectory() && deep) {
            arrayOfFiles = arrayOfFiles.concat(getAllFilesInDir(dirPath, deep));
        } else {
            if (exists && fullPath.endsWith('.txt')) {
                const parsedFile = fs.readFileSync(fullPath);
                arrayOfFiles.push({
                    directory: fullPath,
                    data: parsedFile.toString()
                });
            }
        }
    });
    return arrayOfFiles;
}

const searchNote = ({ file, searchTerm, refList, matchCallback }) => {
    const includes = file.data.includes(searchTerm);
    if (!includes) {
        matchCallback(file, includes, searchTerm, refList);
        return;
    }
    const regex = new RegExp(searchTerm, 'gi');
    const rawMatches = file.data.matchAll(regex);
    if (!rawMatches) {
        matchCallback(file, rawMatches, searchTerm, refList);
        return;
    }
    const matches = Array.from(rawMatches);
    matchCallback(file, matches, searchTerm, refList);
}

const searchNotes = (searchTerm, matchCallback) => {
    const config = getConfig();
    const refList = searchTerm.includes('ref:') ? getRefList() : null;
    const files = getAllFilesInDir(config.path);
    files.forEach(file => searchNote({ file, searchTerm, refList, matchCallback }));
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


const foundReferenceCallback = (file, matches, searchTerm, refList) => {
    let alteredRefList = false;
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
        console.log(refInfo);
    });
    if (alteredRefList) {
        fs.writeFileSync(refListPath, JSON.stringify(refList, null, 4));
    }
}

const getRefList = () => {
    fs.ensureFileSync(refListPath);
    const refListData = fs.readFileSync(refListPath).toString();
    return refListData ? JSON.parse(refListData) : {};
}

if (argv.search) {
    searchNotes(argv.search, foundNotesCallback);
    return;
}

if (argv._.includes('ref')) {
    const refName = argv._[1];
    if (argv.list) {
        const refList = getRefList();
        const entries = Object.entries(refList);
        entries.forEach(entry => {
            const key = entry[0].replace('ref:', '');
            const desc = entry[1] ? ` - ${entry[1]}` : '';
            console.log(`${chalk.greenBright.bold(key)}${desc}`)
        });
        return;
    }
    if (argv.view) {
        const refList = getRefList();
        const entries = Object.entries(refList);
        entries.forEach(entry => {
            const key = entry[0];
            const desc = entry[1] ? ` - ${entry[1]}` : '';
            console.log(`${chalk.greenBright.bold(key)}${chalk.italic.yellow(desc)}`)
            searchNotes(`ref:${entry[0]}`, foundReferenceCallback);
            console.log(chalk.greenBright('–'.repeat(30)));
        });
        return;
    }
    searchNotes('ref:' + refName, foundReferenceCallback);
    return;
}


// Set the notes path
if (argv.path) {
    
    updateNotePath(argv.path);
    return;
}

// Open the notes folder
if (argv.open) {
    const config = getConfig();
    spawn('open', [config.path]);

    return;
}

// Go to a previous note
if (argv._.length) {
    const dateNum = argv._[0];
    if (typeof dateNum === "number" && dateNum < 0) {
        if (argv.p) {
            // Preview the note
           previewNote(dateNum);
        } else {
            // Open the note
            goToDate(dateNum);
        }
    }
    return;
}

// Preview a note
if (argv.p) {
    const prevNumber = typeof argv.p === "number" ? argv.p : null;

    if (argv.p === "week") {
        previewListOfNotes(7);
    } else {
        previewNote(prevNumber);
    }
    return;
}

// Initialize note
createNewNote(new Date());