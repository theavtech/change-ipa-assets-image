import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';

/**
 * Ensures that the output directory exists.
 * @param {string} dirPath - The path to the directory.
 */
function ensureDirectoryExistence(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

/**
 * Unzips a zip file to the specified output directory.
 * @param {string} zipPath - The path to the zip file.
 * @param {string} [outputPath=path.join(process.cwd(), 'output')] - The path to the output directory. Defaults to 'output' directory in the current directory.
 * @returns {string} - The full path of the output directory.
 */
export function unZip(zipPath, outputPath = path.join(process.cwd(), 'output/ipa_extract')) {
    ensureDirectoryExistence(outputPath);
    const zip = new AdmZip(zipPath);
    zip.getEntries().forEach(entry => {
        if (!entry.entryName.startsWith('__MACOSX/')) {
            zip.extractEntryTo(entry, outputPath, true, true);
        }
    });
    return path.resolve(outputPath);
}

/**
 * Zips a directory to the specified output path.
 * @param {string} directoryPath - The path to the directory to zip.
 * @param {string} [outputPath=path.join(process.cwd(), 'output')] - The path to the output zip file. Defaults to 'output' directory in the current directory.
 * @returns {string} - The full path of the output zip file.
 */
export function zip(directoryPath, outputPath) {
    if (!outputPath) {
        ensureDirectoryExistence(path.join(process.cwd(), 'output'));
        const directoryName = path.basename(directoryPath);
        outputPath = path.join(process.cwd(), 'output', `${directoryName}.ipa`);
    }
    const zip = new AdmZip();
    zip.addLocalFolder(directoryPath);
    zip.writeZip(outputPath);
    return path.resolve(outputPath);
}
