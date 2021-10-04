const chalk = require('chalk');

class Log {
    static preview = (str, dividerLength, notePath, useColoredText = true) => {
        const mainText = useColoredText ? chalk.yellowBright(str.trim()) : str.trim();
        const divider = chalk.blueBright('▀'.repeat(dividerLength));
        this.pathHeader(notePath, dividerLength);
        console.log(mainText);
        console.log(divider);
    }

    static pathHeader = (notePath, dividerLength) => {
        const divider = chalk.blueBright('▀'.repeat(dividerLength));
        console.log(chalk.blueBright('▄').repeat(dividerLength));
        console.log(chalk.blueBright.italic(notePath));
        console.log(divider);
    }

    // Log in red
    static red = message => console.log(chalk.redBright(message));

    // Log in green
    static green = message => console.log(chalk.greenBright(message));

    // Log key and value
    static keyValue = (key, value, keyColor, valueColor) => 
        console.log(`${chalk[keyColor].bold(key)}${chalk.italic[valueColor](value)}`);
}

module.exports = Log;