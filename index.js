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

const searchNotes = (searchTerm) => {
    const config = getConfig();
    const files = getAllFilesInDir(config.path);
    files.forEach(file => {
        const includes = file.data.includes(searchTerm);
        if (!includes) return;
        const regex = new RegExp(searchTerm, 'g');
        const rawMatches = file.data.matchAll(regex);
        if (!rawMatches) return;
        const matches = Array.from(rawMatches);
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
        //console.dir(Array.from(matches));
        //const output = file.data.replace(regex, chalk.bgYellowBright.black(searchTerm));
        //previewLog(output, file.directory.length, file.directory, false);
    });
}

if (argv.search) {
    searchNotes(argv.search);
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