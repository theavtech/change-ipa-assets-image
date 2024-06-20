import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';

/**
 * Ensures that the output directory exists.
 * @param {string} dirPath - The path to the directory.
 */
function ensureDirectoryExistence(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

// Function to parse image names and return metadata
function parseImageName(imageName) {
    const regex = /(AppIcon|LaunchImage)(\d+x\d+)?(@(\dx))?(~(\w+))?\.png/;
    const match = imageName.match(regex);
    if (!match) return null;

    const [, baseName, size = '', , scale = '1x', , idiom = 'universal'] = match;
    const expectedSize = size && scale ? (parseInt(size.split('x')[0]) * parseInt(scale[0])).toString() : size;
    return {
        filename: imageName,
        baseName,
        size,
        scale,
        idiom,
        expectedSize: expectedSize
    };
}

// Function to create Contents.json for app icons
function createAppIconContentsJson(imageSet) {
    const images = imageSet.map(({ filename, size, scale, idiom, expectedSize }) => {
        const entry = {
            size: size,
            'expected-size': expectedSize,
            filename: `${expectedSize}.png`,
            folder: "Assets.xcassets/AppIcon.appiconset/",
            idiom,
            scale
        };

        if (size === "1024x1024") {
            entry.size = "1024x1024";
            entry.filename = "1024.png";
            entry['expected-size'] = "1024";
            entry.idiom = "ios-marketing";
            entry.folder = "Assets.xcassets/AppIcon.appiconset/";
            entry.scale = "1x";
        }

        return entry;
    });

    return {
        images
    };
}

// Function to create Contents.json for LaunchImage
function createLaunchImageContentsJson(imageSet) {
    const images = imageSet.map(({ filename, scale }) => ({
        filename: filename.replace(/~\w+/, ''), // Remove ~iphone, ~ipad, etc.
        idiom: 'universal',
        scale
    }));

    return {
        images,
        info: {
            author: 'xcode',
            version: 1
        }
    };
}

// Function to create Asset directory and Contents.json
function createAssetDirectory(inputDir, outputDir) {
    const files = fs.readdirSync(inputDir);
    const appIcons = [];
    const launchImages = [];

    // Parse image names and organize them into sets
    for (const file of files) {
        const metadata = parseImageName(file);
        if (!metadata) continue;

        const { baseName } = metadata;
        if (baseName.toLowerCase().includes('appicon')) {
            appIcons.push(metadata);
        } else if (baseName.toLowerCase().includes('launchimage')) {
            launchImages.push(metadata);
        }
    }

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Handle AppIcon
    if (appIcons.length > 0) {
        const appIconDir = path.join(outputDir, 'AppIcon.appiconset');
        if (!fs.existsSync(appIconDir)) {
            fs.mkdirSync(appIconDir, { recursive: true });
        }

        const contentsJson = createAppIconContentsJson(appIcons);
        fs.writeFileSync(
            path.join(appIconDir, 'Contents.json'),
            JSON.stringify(contentsJson, null, 2),
            'utf8'
        );

        // Copy AppIcon files to the corresponding directory with expected size filenames
        for (const { filename, expectedSize } of appIcons) {
            const srcPath = path.join(inputDir, filename);
            const destPath = path.join(appIconDir, `${expectedSize}.png`);
            fs.copyFileSync(srcPath, destPath);
        }
    }

    // Handle LaunchImage
    if (launchImages.length > 0) {
        const launchImageDir = path.join(outputDir, 'LaunchImage.imageset');
        if (!fs.existsSync(launchImageDir)) {
            fs.mkdirSync(launchImageDir, { recursive: true });
        }

        const contentsJson = createLaunchImageContentsJson(launchImages);
        fs.writeFileSync(
            path.join(launchImageDir, 'Contents.json'),
            JSON.stringify(contentsJson, null, 2),
            'utf8'
        );

        // Copy LaunchImage files to the corresponding directory
        for (const { filename } of launchImages) {
            const srcPath = path.join(inputDir, filename);
            const destPath = path.join(launchImageDir, filename.replace(/~\w+/, ''));
            fs.copyFileSync(srcPath, destPath);
        }
    }

    console.log(`Assets.xcassets directory created successfully at ${outputDir}`);
}

// Function to get images path and output directory
export async function generateAssetsXcassets(inputDir = "./output/assets", outputDir = "./output/Assets.xcassets") {
    try {
        createAssetDirectory(inputDir, outputDir);
    } catch (error) {
        console.error('Error creating Assets.xcassets:', error);
    }
};


/**
 * Extracts assets from a .car file to the specified output directory.
 * @param {string} [carPath=path.join(process.cwd(), 'output', 'Payload', 'Runner.app', 'Assets.car')] - The path to the .car file. Defaults to './output/Payload/Runner.app/Assets.car'.
 * @param {string} [outputPath=path.join(process.cwd(), 'output', 'assets')] - The path to the output directory. Defaults to 'output/assets' directory in the current directory.
 * @returns {Promise<string>} - The full path of the output directory.
 */
export function extractCar(carPath = path.join(process.cwd(), 'output', 'ipa_extract', 'Payload', 'Runner.app', 'Assets.car'), outputPath = path.join(process.cwd(), 'output', 'assets')) {
    ensureDirectoryExistence(outputPath);
    return new Promise((resolve, reject) => {
        const command = `./src/acextract -i ${carPath} -o ${outputPath}`;
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(`Error: ${stderr}`);
            } else {
                resolve(path.resolve(outputPath));
            }
        });
    });

}

/**
 * Creates a .car file from the specified directory using `actool`.
 * @param {string} assetsPath - The path to the directory containing assets.
 * @param {string} [carOutputPath=path.join(process.cwd(), 'output', 'Assets.car')] - The path to the output .car file. Defaults to 'output/Assets.car' in the current directory.
 * @returns {Promise<string>} - The full path of the output .car file.
 */
export function createCar(assetsPath = "./output/Assets.xcassets", carOutputPath = "./output/ipa_extract/Payload/Runner.app") {
    const outputDir = carOutputPath

    return new Promise((resolve, reject) => {
        const command = `actool --output-format human-readable-text --notices --warnings --platform iphoneos --minimum-deployment-target 12.0 --target-device iphone --target-device ipad --compile ${outputDir} ${assetsPath}`;
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(`Error: ${stderr}`);
            } else {
                resolve(path.resolve(carOutputPath));
            }
        });
    });
}
