#!/usr/bin/env node
const { hideBin } = require('yargs/helpers');
const yargs = require('yargs/yargs');
const { spawn } = require('child_process');
const argv = yargs(hideBin(process.argv)).argv;
const chalk = require('chalk');

const Utils = require('./new_classes/Utils');
const Preview = require('./new_classes/Preview');
const Open = require('./new_classes/Open');
const Search = require('./new_classes/Search');
const Ref = require('./new_classes/Ref');
const Log = require('./new_classes/Log');

const config = Utils.getConfig();
if (!config.path) {
    Log.red('No note path set in the configuration file. Please set one.');
    process.exit(1);
}

if (argv._.includes('ref')) {
    if (argv.list) {
        Ref.list();
        process.exit(1);
    }
    if (argv.open) {
        spawn('open', [Ref.refDir]);
        process.exit(1);
    }
    const refName = argv._[1];
    if (!refName) {
        Log.red('Please provide a ref name or option');
        process.exit(1);
    }
    Ref.initiateRef({ refName });
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
    process.exit(1);
}

// Set the notes path
if (argv.path) {
    Utils.updateNotes(argv.path);
    process.exit(1);
}

// Open the notes folder
if (argv.open) {
    Open.notesFolder();
    process.exit(1);
}

// Go to a previous note
if (argv._.length && !argv._.includes('ref')) {
    Open.previousNote(argv);
    process.exit(1);
}

// Search notes
if (argv.search) {
    Search.allAndLogResults(argv.search);
    process.exit(1);
}

// Initialize note
Utils.newNote(new Date());