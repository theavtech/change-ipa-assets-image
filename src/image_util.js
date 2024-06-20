import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import os from 'os';
import { execSync } from "child_process";

// Function to change the saturation of images in a folder
export async function changeSaturationOfImages(inputDir, saturation = 100) {
    if (!fs.existsSync(inputDir)) {
        console.error(`Input directory "${inputDir}" does not exist.`);
        return;
    }

    const files = fs.readdirSync(inputDir);
    const imageFiles = files.filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file));

    if (imageFiles.length === 0) {
        console.log('No image files found in the directory.');
        return;
    }

    for (const file of imageFiles) {
        const inputFilePath = path.join(inputDir, file);
        const tempFilePath = path.join(os.tmpdir(), file); // Temporary file path

        try {
            execSync("xcrun -sdk iphoneos pngcrush -revert-iphone-optimizations " + inputFilePath + " " + tempFilePath)
            await sharp(tempFilePath)
                .modulate({ saturation })
                .toFile(inputFilePath);  // Save to temporary file

            // Replace original file with the processed temporary file
            // fs.copyFileSync(tempFilePath, inputFilePath);
            fs.unlinkSync(tempFilePath);  // Remove the temporary file
            console.log(`Processed ${file} with saturation ${saturation}`);
        } catch (error) {
            console.error(`Error processing ${file}:`, error);
        }
    }

    console.log('Saturation adjustment complete.');
}


// Function to adjust image saturation in a directory
const adjustImageSaturation = async (dir, saturationFactor) => {
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif'];

    const traverseDirectory = async (currentPath) => {
        const files = await fs.promises.readdir(currentPath);
        for (const file of files) {
            const fullPath = path.join(currentPath, file);
            if ((await fs.promises.stat(fullPath)).isDirectory()) {
                await traverseDirectory(fullPath);
            } else if (imageExtensions.includes(path.extname(file).toLowerCase())) {
                let tempFilename = file.split('.')[0] + "tem." + file.split('.')[1];
                let oldFilename = file;
                execSync("xcrun -sdk iphoneos pngcrush -revert-iphone-optimizations " + path.join(currentPath, oldFilename) + " " + path.join(currentPath, tempFilename))
                fs.unlinkSync(path.join(currentPath, oldFilename));
                // Adjust image saturation]
                await sharp(path.join(currentPath, tempFilename))
                    .modulate({ saturation: saturationFactor })
                    .toFile(fullPath);
                fs.unlinkSync(path.join(currentPath, tempFilename))
            }
        }
    };

    await traverseDirectory(dir);
};