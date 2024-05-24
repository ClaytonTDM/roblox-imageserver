const express = require("express");
const Jimp = require("jimp");
const screenshot = require('screenshot-desktop');
const fs = require('fs');
const app = express();
const port = 2021;

app.get("/", async (req, res) => {
    const imageUrl = req.query.url;
    const image = await Jimp.read(imageUrl);

    // If the image is larger than 960x540, scale it down
    if (image.bitmap.width > 960 || image.bitmap.height > 540) {
        image.scaleToFit(960, 540);
    }

    const width = image.bitmap.width;
    const height = image.bitmap.height;
    const pixelData = [];

    image.scan(0, 0, width, height, function(x, y, idx) {
        const red = this.bitmap.data[idx + 0];
        const green = this.bitmap.data[idx + 1];
        const blue = this.bitmap.data[idx + 2];
        const alpha = this.bitmap.data[idx + 3]; // Get the alpha value
        const transparency = 1 - (alpha / 255); // Convert alpha to transparency

        pixelData.push({
            c: `${red},${green},${blue}`,
            l: `${x},${y}`,
            t: transparency.toFixed(2) // Include transparency in the pixel data
        });
    });

    res.send([
        {
            w: width,
            h: height,
        },
        pixelData
    ]);
});

app.get("/ss", async (req, res) => {
    const outputFile = 'screenshot.png';
    await screenshot({ filename: outputFile });
    const image = await Jimp.read(outputFile);

    // If the image is larger than 960x540, scale it down
    if (image.bitmap.width > 960 || image.bitmap.height > 540) {
        image.scaleToFit(360, 203);
    }

    const width = image.bitmap.width;
    const height = image.bitmap.height;
    const pixelData = [];

    image.scan(0, 0, width, height, function(x, y, idx) {
        const red = this.bitmap.data[idx + 0];
        const green = this.bitmap.data[idx + 1];
        const blue = this.bitmap.data[idx + 2];
        const alpha = this.bitmap.data[idx + 3]; // Get the alpha value
        const transparency = 1 - (alpha / 255); // Convert alpha to transparency

        pixelData.push({
            c: `${red},${green},${blue}`,
            l: `${x},${y}`,
            t: transparency.toFixed(2) // Include transparency in the pixel data
        });
    });

    // Delete the temporary screenshot file
    fs.unlinkSync(outputFile);

    res.send([
        {
            w: width,
            h: height,
        },
        pixelData
    ]);
});

app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
});