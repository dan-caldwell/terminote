const fs = require('fs-extra');
const path = require('path');
const Utils = require('./Utils');
const prompt = require('prompt');
const chalk = require('chalk');
const { spawn } = require('child_process');
const Log = require('./Log');

class Ref {

    static refDir = path.join(Utils.getConfig().path, 'refs');

    static refPath = ({ refName }) => path.join(this.refDir, `${refName}.txt`);

    static openRef = ({ refName }) => {
        const refPath = this.refPath({ refName });
        fs.ensureFileSync(refPath);
        spawn('nano', [refPath], {
            stdio: 'inherit'
        });
    }

    static initiateRef = async ({ refName }) => {
        const refExists = fs.existsSync(this.refPath({ refName }));
        if (refExists) {
            this.openRef({ refName });
        } else {
            await this.createRefPrompt({ refName });
        }
    }

    static createRefPrompt = async ({ refName }) => {
        prompt.message = '';
        prompt.start();
        const { shouldCreate } = await prompt.get({
            properties: {
                shouldCreate: {
                    description: chalk.blueBright(`Ref ${refName} does not exist. Create ref? (y/n)`)
                }
            }
        });
        prompt.stop();
        switch (shouldCreate) {
            case "yes":
            case "y":
                this.openRef({ refName });
                break;
            case "no":
            case "n":
                process.exit(1);
        }
    }

    static list = () => {
        try {
            const files = fs.readdirSync(this.refDir).filter(fileName => fileName.endsWith('.txt'));
            const refs = files.map(fileName => fileName.replace('.txt', ''));
            refs.forEach(ref => {
                console.log(chalk.greenBright(ref));
            });
        } catch (err) {
            Log.red('Could not read ref list');
        }
    }

}

module.exports = Ref;