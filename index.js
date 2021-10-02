#!/usr/bin/env node
const { hideBin } = require('yargs/helpers');
const yargs = require('yargs/yargs');
const argv = yargs(hideBin(process.argv)).argv;
const path = require('path');
const fs = require('fs-extra');
const dateformat = require('./dateformat');
const { spawn } = require('child_process');
const chalk = require('chalk');

const { searchNotes, foundNotesCallback } = require('./components/search');
const { foundReferenceCallback, getRefList, registerRefsFromNote } = require('./components/refs');
const { previewLog } = require('./components/log');
const { getConfig, configPath } = require('./components/file');

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
    // Add 6 hours because dateformat returns the wrong date if the time is exactly at 00:00:00.000
    dateObj.setHours(dateObj.getHours() + 6);
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


const previousDate = (prevDateNum = 0) => {
    const date = new Date();
    date.setDate(date.getDate() - Math.abs(prevDateNum));
    return date;
}

const goToDate = (prevDateNum, isFileId) => {
    const date = isFileId ? prevDateNum : previousDate(prevDateNum);
    createNewNote(date);
}

const previewNote = async (prevDateNum, isFileId = false) => {
    const date = isFileId ? prevDateNum : previousDate(prevDateNum);
    const notePath = await getNotePathFromDate(date);
    const file = fs.readFileSync(notePath);
    const str = file.toString();
    const len = notePath.length;
    // Cat wasn't working so I'm just console.logging the file
    previewLog(str.trim(), len, notePath);
}

// Previews a previous amount of notes
const previewListOfNotes = async (numNotes) => {
    for (let i = numNotes; i >= 0; i--) {
        await previewNote(-i);
    }
}

if (argv.search) {
    searchNotes(argv.search, foundNotesCallback);
    return;
}

if (argv._.includes('ref')) {
    const refName = argv._[1];
    // List all refs
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
    // View all refs
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
    // Edit ref
    if (argv.edit) {
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
    const splitDateNum = dateNum.split('-');
    // Check if passing a file ID (date)
    const dateNumDate = new Date(dateNum);
    const year = dateNumDate.getFullYear();
    // Open the note at the date
    if (year > 2000 && splitDateNum.length === 3) {
        if (argv.p) {
            previewNote(dateNumDate, true);
        } else {
            goToDate(dateNumDate, true);
        }
        return;
    }
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

// Do this via yargs
if (argv.help) {
    console.log(chalk.blueBright.bold('Terminote'));
    const cyan = chalk.cyanBright;
    console.log(`Set notes folder path`, `note --path your_path_here`);
    console.log(`Open notes folder`, `note --open`);
    console.log(`Open today's note`, `note`);
    console.log(`Open a note from n number of days ago`, `note -1`);
    console.log(`Open a note from a date`, `note 2021-09-21`);
    console.log(`Preview a note`, `note your_note -p`);
    console.log(`Create a reference in a note`, "ref:your-ref-name(ref description here)\n```\nref data goes here\n```");
    console.log(`View a ref`, `note ref your-ref-name`);
    console.log(`List all refs`, `note ref --list`);
    console.log(`View all refs with data`, `note ref --view`);

    return;
}

// Initialize note
createNewNote(new Date());