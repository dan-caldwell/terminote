const fs = require('fs-extra');
const path = require('path');

const getFileIdFromPath = (filePath) => filePath.split('/').pop().replace('.txt', '').split('-').slice(0, -1).join('-');

const getAllFilesInDir = (dirPath, deep = true, withData = true) => {
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

// Set the path to use the notes
const configPath = path.join(__dirname, '../config.json');

const getConfig = () => {
    const configStr = fs.readFileSync(configPath).toString();
    return configStr ? JSON.parse(configStr) : { path: '' };
}

module.exports = {
    getFileIdFromPath,
    getAllFilesInDir,
    getConfig,
    configPath
}