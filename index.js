#!/usr/bin/env node
const { hideBin } = require('yargs/helpers');
const yargs = require('yargs/yargs');
const argv = yargs(hideBin(process.argv)).argv;
const path = require('path');
const fs = require('fs-extra');
const dateformat = require('./dateformat');
const { spawn } = require('child_process');

// Set the path to use the notes

const updateNotePath = (notePath = true) => {
    const configPath = path.join(__dirname, './config.json');
    fs.ensureFileSync(configPath);
    const configStr = fs.readFileSync(configPath).toString();
    const config = configStr ? JSON.parse(configStr) : { path: '' };
    // Set the config path
    config.path = typeof notePath === "string" ? notePath : process.cwd();
    fs.writeFileSync(configPath, JSON.stringify(config, null, 4));
    console.log('Updated note path:', config.path);
}

if (argv.path) {
    updateNotePath(argv.path);
}

const createNewNote = async () => {
    // Make sure config exists
    const configPath = path.join(__dirname, './config.json');
    const pathExists = fs.pathExistsSync(configPath);
    if (!pathExists) updateNotePath();
    const configStr = fs.readFileSync(configPath).toString();
    const config = JSON.parse(configStr);
    // Make a new txt file based on the day
    const date = dateformat(new Date(), 'ddd-mmm-dd-yyyy');
    const notePath = config.path + '/' + date + '.txt';
    fs.ensureFileSync(notePath);
    spawn('nano', [notePath], {
        stdio: 'inherit'
    });
}

createNewNote();