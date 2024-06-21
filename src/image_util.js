import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import os from 'os';
import { execSync } from "child_process";

async function addDot(imagePath, savePath, dotRadius = 10) {
    try {

        extract
        const image = sharp(imagePath);
        const metadata = await image.metadata();
        const imageWidth = metadata.width;
        const imageHeight = metadata.height;
        const centerX = Math.floor(imageWidth / 2);
        const centerY = Math.floor(imageHeight / 2);
        const centerPixel = await image.extract({ left: centerX, top: centerY, width: 1, height: 1 }).raw().toBuffer();
        const [r, g, b] = centerPixel;


        if (r == 0 && g == 0 && b == 0) {
            await sharp(imagePath)
                .composite([
                    { input: './src/white.png', gravity: "center" }
                ])
                .toFile(savePath);
        } else {
            await sharp(imagePath)
                .composite([
                    { input: './src/black.png', gravity: "center" }
                ])
                .toFile(savePath);
        }



        console.log(`Dot added to image and ${imageWidth} / ${imageHeight} saved to:`, savePath);
    } catch (error) {
        console.error('Error adding dot:', error);
    }
}


// Function to change the saturation of images in a folder
export async function addDotIntoImages(inputDir) {
    if (!fs.existsSync(inputDir)) {
        console.error(`Input directory "${inputDir}" does not exist.`);
        return;
    }

    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif'];

    const traverseDirectory = async (currentPath) => {
        const files = await fs.promises.readdir(currentPath);
        for (const file of files) {
            const fullPath = path.join(currentPath, file);
            const stat = await fs.promises.stat(fullPath);

            if (stat.isDirectory()) {
                await traverseDirectory(fullPath);
            } else if (imageExtensions.includes(path.extname(file).toLowerCase())) {
                const tempFilePath = path.join(os.tmpdir(), file); // Temporary file path

                try {
                    execSync(`xcrun -sdk iphoneos pngcrush -revert-iphone-optimizations "${fullPath}" "${tempFilePath}"`);
                    // await addDotToCenter(tempFilePath, fullPath);
                    await addDot(tempFilePath, fullPath)
                } catch (error) {
                    console.error(`Error processing ${file}:`, error);
                }
            }
        }
    };

    await traverseDirectory(inputDir);
    console.log('Saturation adjustment complete.');
}