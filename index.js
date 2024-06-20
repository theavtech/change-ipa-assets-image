import { unZip, zip } from './src/zip_util.js';
import { extractCar, createCar, generateAssetsXcassets } from './src/asset_car_util.js';
import { changeSaturationOfImages } from './src/image_util.js';
import fs from 'fs';

async function main(params) {
    unZip("app.ipa");
    await extractCar("output/ipa_extract/Payload/Runner.app/Assets.car");
    await changeSaturationOfImages("./output/assets", 100);
    await changeSaturationOfImages("./output/ipa_extract/Payload/Runner.app", 100);
    await generateAssetsXcassets();
    await createCar()
    zip("./output/ipa_extract", "./modified_icon.ipa");
    // clear working directory
    fs.rmSync("./output", { recursive: true })
}
main()


