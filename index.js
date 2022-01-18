#!/usr/bin/env node
const { hideBin } = require('yargs/helpers');
const yargs = require('yargs/yargs');
const argv = yargs(hideBin(process.argv)).argv;

const Utils = require('./classes/Utils');
const Preview = require('./classes/Preview');
const Open = require('./classes/Open');
const Search = require('./classes/Search');

Utils.configPathExists();

const notePath = argv._[0];

// Do this via yargs
if (argv.help) {
    console.log(chalk.blueBright.bold('Terminote'));
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

// Set the notes path
if (argv.path) {
    Utils.updateNotes(argv.path);
    process.exit(1);
}

// Open the current day's note
if (!notePath) {
    if (argv.list) {
        Utils.list('');
        return;
    } else if (argv.view) {
        Preview.note(`days/${Utils.dateToFormattedFileName(new Date())}`);
        return;
    } else if (argv.open) {
        Open.notePath('');
    }
    // Initialize note
    Utils.newNoteFromDate(new Date());
    return;
} else {
    if (argv.list) {
        // List all files in the notePath directory
        Utils.list(notePath);
    } else if (argv.view) {
        Preview.note(notePath);
    } else if (argv.open) {
        Open.notePath(notePath);
    } else {
        Utils.newNote(notePath);
    }
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

// Search notes
if (argv.search) {
    Search.allAndLogResults(argv.search);
    process.exit(1);
}