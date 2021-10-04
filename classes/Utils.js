const path = require('path');
const fs = require('fs-extra');
const Path = require('./Path');
const Ref = require('./Ref');
const chalk = require('chalk');
const dateformat = require('../dateformat');
const { spawn } = require('child_process');

class Utils {

    static configPath = path.join(__dirname, '../config.json');

    // Gets the config
    static getConfig = () => {
        const configStr = fs.readFileSync(this.configPath).toString();
        return configStr ? JSON.parse(configStr) : { path: '' };
    }

    // Gets a previous date given a number (e.g. -1 = yesterday)
    static previousDate = (prevDateNum = 0) => {
        const date = new Date();
        date.setDate(date.getDate() - Math.abs(prevDateNum));
        return date;
    }

    static notePathFromDate = async (dateObj) => {
        // Make sure config exists
        const pathExists = fs.pathExistsSync(Utils.configPath);
        if (!pathExists) Path.updateNotes();
        const config = this.getConfig();
        // Add 6 hours because dateformat returns the wrong date if the time is exactly at 00:00:00.000
        dateObj.setHours(dateObj.getHours() + 6);
        // Make a new txt file based on the day
        const date = dateformat(dateObj, 'yyyy-mm-dd-ddd');
        const notePath = config.path + '/' + date + '.txt';
        fs.ensureFileSync(notePath);
        return notePath;
    }

    static newNote = async (dateObj) => {
        const notePath = await this.notePathFromDate(dateObj);
        const noteDataBefore = fs.readFileSync(notePath).toString();
        const currentNote = spawn('nano', [notePath], {
            stdio: 'inherit'
        });
        // Register new refs
        currentNote.on('close', () => Ref.updateFromNote(notePath, noteDataBefore));
    }

    static getAllFilesInDir = (dirPath, deep = true, withData = true) => {
        const files = fs.readdirSync(dirPath);
        let arrayOfFiles = [];
        files.forEach(file => {
            const fullPath = dirPath + "/" + file;
            // Check if the full path exists
            const exists = fs.existsSync(fullPath);
            if (!exists) return console.log(chalk.redBright('File does not exist', fullPath));
            if (fs.statSync(fullPath).isDirectory() && deep) {
                arrayOfFiles = arrayOfFiles.concat(this.getAllFilesInDir(dirPath, deep));
            } else {
                if (exists && fullPath.endsWith('.txt')) {
                    if (!withData) {
                        arrayOfFiles.push(fullPath);
                        return;
                    }
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
}

module.exports = Utils;