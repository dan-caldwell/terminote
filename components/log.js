// const chalk = require('chalk');

// const logNotePathHeader = (notePath, dividerLength) => {
//     const divider = chalk.blueBright('▀'.repeat(dividerLength));
//     console.log(chalk.blueBright('▄').repeat(dividerLength));
//     console.log(chalk.blueBright.italic(notePath));
//     console.log(divider);
// }

// const previewLog = (str, dividerLength, notePath, useColoredText = true) => {
//     const mainText = useColoredText ? chalk.yellowBright(str.trim()) : str.trim();
//     const divider = chalk.blueBright('▀'.repeat(dividerLength));
//     logNotePathHeader(notePath, dividerLength);
//     console.log(mainText);
//     console.log(divider);
// }

// module.exports = {
//     logNotePathHeader,
//     previewLog
// }