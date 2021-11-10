const path = require('path');
const fs = require('fs-extra');
const chalk = require('chalk');
const dateformat = require('../dateformat');
const { spawn } = require('child_process');
const Log = require('./Log');

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

    // This is used for checking if a note path exists and will log the result if it doesn't exist
    // Do not use to actually check if a note path exists because it doesn't return anything
    static notePathExists = rawNotePath => {
        const notePath = this.createNotePath(rawNotePath, false);
        const exists = fs.existsSync(notePath);
        if (!exists) {
            Log.red(`Note path ${rawNotePath} does not exist`);
            process.exit(1);
        }
    }

    static configPathExists = () => {
        // Make sure config exists
        const pathExists = fs.pathExistsSync(this.configPath);
        if (!pathExists) {
            Log.red('Note path does not exist in config. Please add a note path to the config.');
            process.exit(1);
        }
    }

    static notePathFromDate = dateObj => {
        // Make sure config exists
        this.configPathExists();
        const config = this.getConfig();
        // Add 6 hours because dateformat returns the wrong date if the time is exactly at 00:00:00.000
        dateObj.setHours(dateObj.getHours() + 6);
        // Make a new txt file based on the day
        const date = dateformat(dateObj, 'yyyy-mm-dd-ddd');
        const notePath = config.path + '/days/' + date + '.txt';
        fs.ensureFileSync(notePath);
        return notePath;
    }

    static dateToFormattedFileName = dateObj => {
        dateObj.setHours(dateObj.getHours() + 6);
        return dateformat(dateObj, 'yyyy-mm-dd-ddd');
    }

    static createNoteDirPath = (rawNotePath, ensureDir) => {
        // Make sure config exists
        this.configPathExists();
        const config = this.getConfig();
        const dirPath = path.join(config.path, rawNotePath);
        if (ensureDir) fs.ensureDirSync(dirPath);
        return dirPath;
    }

    static createNotePath = (rawNotePath, ensureFile = true) => {
        // Make sure config exists
        this.configPathExists();
        const config = this.getConfig();
        const notePath = path.join(config.path, rawNotePath + '.txt');
        if (ensureFile) fs.ensureFileSync(notePath);
        return notePath;
    }

    // Opens a note at a path
    static openNote = (notePath) => {
        return spawn('nano', [notePath], {
            stdio: 'inherit'
        });
    }

    static newNote = rawNotePath => {
        const notePath = this.createNotePath(rawNotePath);
        this.openNote(notePath);
    }

    static newNoteFromDate = dateObj => {
        const notePath = this.notePathFromDate(dateObj);
        this.openNote(notePath);
    }

    static getAllFilesInDir = ({ dirPath, deep = true, withData = true }) => {
        const files = fs.readdirSync(dirPath);
        let arrayOfFiles = [];
        files.forEach(file => {
            const fullPath = dirPath + "/" + file;
            // Check if the full path exists
            const exists = fs.existsSync(fullPath);
            if (!exists) return console.log(chalk.redBright('File does not exist', fullPath));
            if (fs.statSync(fullPath).isDirectory() && deep) {
                arrayOfFiles = arrayOfFiles.concat(this.getAllFilesInDir({ dirPath: fullPath, deep, withData }));
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

    // Check if two objects have the same values
    static isEqualObject = (obj1, obj2) => {
        if ((!obj1 && obj2) || (!obj2 && obj1)) return false;
        for (const key in obj1) {
            if (!(key in obj2)) return false;
            if (obj1[key] !== obj2[key]) return false;
        }
        return true;
    }

    static updateNotes = (notePath = true) => {
        const configPath = Utils.configPath;
        fs.ensureFileSync(configPath);
        const config = Utils.getConfig();
        // Set the config path
        config.path = typeof notePath === "string" ? notePath : process.cwd();
        fs.writeFileSync(configPath, JSON.stringify(config, null, 4));
        console.log('Updated note path:', config.path);
    }

    static list = rawNotePath => {
        const dirPath = this.createNoteDirPath(rawNotePath, false);
        this.configPathExists();
        const { path: configPath } = this.getConfig();
        const exists = fs.existsSync(dirPath);
        if (!exists) {
            Log.red(`Folder ${rawNotePath} does not exist`);
            return;
        }
        try {
            const files = this.getAllFilesInDir({
                dirPath,
                deep: true,
                withData: false
            });
            const refs = files.map(fileName => fileName.replace('.txt', '').replace(configPath, '').slice(1));
            refs.forEach(ref => {
                console.log(chalk.greenBright(ref));
            });
        } catch (err) {
            console.log(err);
            Log.red('Could not read folder list');
        }
    }
}

module.exports = Utils;