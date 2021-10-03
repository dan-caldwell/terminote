#!/usr/bin/env node
const { hideBin } = require('yargs/helpers');
const yargs = require('yargs/yargs');
const argv = yargs(hideBin(process.argv)).argv;
const path = require('path');
const fs = require('fs-extra');
const dateformat = require('./dateformat');
const { spawn } = require('child_process');
const chalk = require('chalk');

const { foundReferenceCallback, getRefList, registerRefsFromNote } = require('./components/refs');
const { previewLog } = require('./components/log');
const { getConfig, configPath } = require('./components/file');


const Path = require('./classes/Path');
const Open = require('./classes/Open');
const Utils = require('./classes/Utils');
const Search = require('./classes/Search');

// Set the notes path
if (argv.path) {
    Path.updateNotes(argv.path);
    return;
}

// Open the notes folder
if (argv.open) {
    Open.notesFolder();
    return;
}

// Go to a previous note
if (argv._.length) {
    Open.previousNote(argv);
    return;
}

if (argv.search) {
    Search.allAndLogResults(argv.search);
    return;
}

// const updateNotePath = (notePath = true) => {
//     fs.ensureFileSync(configPath);
//     const config = getConfig();
//     // Set the config path
//     config.path = typeof notePath === "string" ? notePath : process.cwd();
//     fs.writeFileSync(configPath, JSON.stringify(config, null, 4));
//     console.log('Updated note path:', config.path);
// }

// const getNotePathFromDate = async (dateObj) => {
//     // Make sure config exists
//     const pathExists = fs.pathExistsSync(configPath);
//     if (!pathExists) updateNotePath();
//     const config = getConfig();
//     // Add 6 hours because dateformat returns the wrong date if the time is exactly at 00:00:00.000
//     dateObj.setHours(dateObj.getHours() + 6);
//     // Make a new txt file based on the day
//     const date = dateformat(dateObj, 'yyyy-mm-dd-ddd');
//     const notePath = config.path + '/' + date + '.txt';
//     fs.ensureFileSync(notePath);
//     return notePath;
// }

// const createNewNote = async (dateObj) => {
//     const notePath = await getNotePathFromDate(dateObj);
//     const noteDataBefore = fs.readFileSync(notePath).toString();
//     const currentNote = spawn('nano', [notePath], {
//         stdio: 'inherit'
//     });
//     // Register new refs
//     currentNote.on('close', () => registerRefsFromNote(notePath, noteDataBefore));
// }


// const previousDate = (prevDateNum = 0) => {
//     const date = new Date();
//     date.setDate(date.getDate() - Math.abs(prevDateNum));
//     return date;
// }

// const goToDate = (prevDateNum, isFileId) => {
//     const date = isFileId ? prevDateNum : previousDate(prevDateNum);
//     createNewNote(date);
// }

// const previewNote = async (prevDateNum, isFileId = false) => {
//     const date = isFileId ? prevDateNum : previousDate(prevDateNum);
//     const notePath = await getNotePathFromDate(date);
//     const file = fs.readFileSync(notePath);
//     const str = file.toString();
//     const len = notePath.length;
//     // Cat wasn't working so I'm just console.logging the file
//     previewLog(str.trim(), len, notePath);
// }

// Previews a previous amount of notes
const previewListOfNotes = async (numNotes) => {
    for (let i = numNotes; i >= 0; i--) {
        await previewNote(-i);
    }
}



if (argv._.includes('ref')) {
    const refName = argv._[1];
    // List all refs
    if (argv.list) {
        const refList = getRefList();
        const entries = Object.entries(refList);
        entries.forEach(entry => {
            const key = entry[0].replace('ref:', '');
            const desc = entry[1]?.description ? ` - ${entry[1].description}` : '';
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
            const desc = entry[1]?.description ? ` - ${entry[1].description}` : '';
            console.log(`${chalk.greenBright.bold(key)}${chalk.italic.yellow(desc)}`);

            // Log the ref value from the file

            //searchNotes(`ref:${entry[0]}`, foundReferenceCallback);
            console.log(chalk.greenBright('–'.repeat(30)));
        });
        return;
    }
    // Edit ref
    if (argv.edit) {
        return;
    }

    // Return the ref found in the refList.json file rather than searching every file for the ref

    //searchNotes('ref:' + refName, foundReferenceCallback);
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
Utils.newNote(new Date());