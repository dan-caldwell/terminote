#!/usr/bin/env node
const { hideBin } = require('yargs/helpers');
const yargs = require('yargs/yargs');
const argv = yargs(hideBin(process.argv)).argv;
const chalk = require('chalk');

const Open = require('./classes/Open');
const Utils = require('./classes/Utils');
const Ref = require('./classes/Ref');
const Search = require('./classes/Search');
const Preview = require('./classes/Preview');

// Set the notes path
if (argv.path) {
    Utils.updateNotes(argv.path);
    return;
}

// Open the notes folder
if (argv.open) {
    Open.notesFolder();
    return;
}

// Go to a previous note
if (argv._.length && !argv._.includes('ref')) {
    Open.previousNote(argv);
    return;
}

// Search notes
if (argv.search) {
    Search.allAndLogResults(argv.search);
    return;
}

// Preview a note
if (argv.p) {
    const prevNumber = typeof argv.p === "number" ? argv.p : null;

    if (argv.p === "week") {
        Preview.listOfNotes(7);
    } else {
        Preview.note(prevNumber);
    }
    return;
}

if (argv._.includes('ref')) {
    const refName = argv._[1];
    // List all refs
    if (argv.list) {
        Ref.list();
        return;
    }
    // View all refs
    if (argv.view) {
        Ref.view();
        return;
    }
    // Edit ref
    if (argv.edit) {
        Ref.edit(refName);
        return;
    }
    // Register all refs
    if (argv.register) {
        Ref.registerAll();
        return;
    }

    // Get a single ref and log it
    Ref.log(refName);
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

const init = async () => {
    // Initialize note
    const { currentNote, notePath, noteDataBefore } = await Utils.newNote(new Date());
    // Register new refs
    currentNote.on('close', () => Ref.updateFromNote(notePath, noteDataBefore));
}

init();