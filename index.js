#!/usr/bin/env node
const { hideBin } = require('yargs/helpers');
const yargs = require('yargs/yargs');
const argv = yargs(hideBin(process.argv)).argv;
const path = require('path');
const fs = require('fs-extra');
const dateformat = require('./dateformat');
const { spawn } = require('child_process');

// Set the path to use the notes

const configPath = path.join(__dirname, './config.json');

const updateNotePath = (notePath = true) => {
    fs.ensureFileSync(configPath);
    const configStr = fs.readFileSync(configPath).toString();
    const config = configStr ? JSON.parse(configStr) : { path: '' };
    // Set the config path
    config.path = typeof notePath === "string" ? notePath : process.cwd();
    fs.writeFileSync(configPath, JSON.stringify(config, null, 4));
    console.log('Updated note path:', config.path);
}

const getNotePathFromDate = async (dateObj) => {
    // Make sure config exists
    const pathExists = fs.pathExistsSync(configPath);
    if (!pathExists) updateNotePath();
    const configStr = fs.readFileSync(configPath).toString();
    const config = JSON.parse(configStr);
    // Make a new txt file based on the day
    const date = dateformat(dateObj, 'ddd-mmm-dd-yyyy');
    const notePath = config.path + '/' + date + '.txt';
    fs.ensureFileSync(notePath);
    return notePath;
}

const createNewNote = async (dateObj) => {
    const notePath = await getNotePathFromDate(dateObj);
    spawn('nano', [notePath], {
        stdio: 'inherit'
    });
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

const previewNote = async (prevDateNum) => {
    const date = previousDate(prevDateNum);
    const notePath = await getNotePathFromDate(date);
    // Cat wasn't working so I'm just console.logging the file
    const file = fs.readFileSync(notePath);
    console.log(file.toString());
}


// Set the notes path
if (argv.path) {
    updateNotePath(argv.path);
    return;
}

// Open the notes folder
if (argv.open) {
    const configStr = fs.readFileSync(configPath).toString();
    const config = JSON.parse(configStr);
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
    previewNote(typeof argv.p === "number" ? argv.p : null);
    return;
}

// Initialize note
createNewNote(new Date());