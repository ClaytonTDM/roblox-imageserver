const express = require("express");
const Jimp = require("jimp");
const screenshot = require("screenshot-desktop");
const fs = require("fs");
const puppeteer = require("puppeteer");
const app = express();
const port = 2021;

let browser, page; // Declare browser and page variables

(async () => {
    browser = await puppeteer.launch({ headless: true });
    page = await browser.newPage();
    await page.setViewport({ width: 960, height: 540 }); // Set the viewport
    await page.goto("data:text/html,");
    /*
    // Inject JavaScript to create a small circle at the mouse's current position
    await page.evaluate(() => {
        addEventListener("click", createBox);

        function createBox(event) {
            var box = document.createElement("div");
            box.className = "box";
            box.style.left = event.pageX + "px";
            box.style.top = event.pageY + "px";
            box.style.padding = '10px';
            box.style.marginLeft = '-10px';
            box.style.marginTop = '-10px';
            box.style.backgroundColor = 'red';
            box.style.borderRadius = '50%';
            box.style.position = 'absolute';
            box.style.zIndex = '999999';
            document.body.appendChild(box);
        }
        
    });
    */
})();

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

    image.scan(0, 0, width, height, function (x, y, idx) {
        const red = this.bitmap.data[idx + 0];
        const green = this.bitmap.data[idx + 1];
        const blue = this.bitmap.data[idx + 2];
        const alpha = this.bitmap.data[idx + 3]; // Get the alpha value
        const transparency = 1 - alpha / 255; // Convert alpha to transparency

        pixelData.push({
            c: `${red},${green},${blue}`,
            l: `${x},${y}`,
            t: transparency.toFixed(2), // Include transparency in the pixel data
        });
    });

    res.send([
        {
            w: width,
            h: height,
        },
        pixelData,
    ]);
});

app.get("/ss", async (req, res) => {
    const outputFile = "screenshot.png";
    await screenshot({ filename: outputFile });
    const image = await Jimp.read(outputFile);

    // If the image is larger than 960x540, scale it down
    if (image.bitmap.width > 960 || image.bitmap.height > 540) {
        image.scaleToFit(960, 540);
    }

    const width = image.bitmap.width;
    const height = image.bitmap.height;
    const pixelData = [];

    image.scan(0, 0, width, height, function (x, y, idx) {
        const red = this.bitmap.data[idx + 0];
        const green = this.bitmap.data[idx + 1];
        const blue = this.bitmap.data[idx + 2];
        const alpha = this.bitmap.data[idx + 3]; // Get the alpha value
        const transparency = 1 - alpha / 255; // Convert alpha to transparency

        pixelData.push({
            c: `${red},${green},${blue}`,
            l: `${x},${y}`,
            t: transparency.toFixed(2), // Include transparency in the pixel data
        });
    });

    // Delete the temporary screenshot file
    fs.unlinkSync(outputFile);

    res.send([
        {
            w: width,
            h: height,
        },
        pixelData,
    ]);
});

app.get("/browser", async (req, res) => {
    // Use setTimeout instead of waitForTimeout
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const screenshotBuffer = await page.screenshot();
    const image = await Jimp.read(screenshotBuffer);

    // If the image is larger than 960x540, scale it down
    if (image.bitmap.width > 960 || image.bitmap.height > 540) {
        image.scaleToFit(960, 540);
    }

    const width = image.bitmap.width;
    const height = image.bitmap.height;
    const pixelData = [];

    image.scan(0, 0, width, height, function (x, y, idx) {
        const red = this.bitmap.data[idx + 0];
        const green = this.bitmap.data[idx + 1];
        const blue = this.bitmap.data[idx + 2];
        const alpha = this.bitmap.data[idx + 3]; // Get the alpha value
        const transparency = 1 - alpha / 255; // Convert alpha to transparency

        pixelData.push({
            c: `${red},${green},${blue}`,
            l: `${x},${y}`,
            t: transparency.toFixed(2), // Include transparency in the pixel data
        });
    });

    res.send([
        {
            w: width,
            h: height,
        },
        pixelData,
    ]);
});

app.get("/click", async (req, res) => {
    const x = parseInt(req.query.x);
    const y = parseInt(req.query.y);

    if (isNaN(x) || isNaN(y)) {
        res.status(400).send("Invalid parameters. x and y should be numbers.");
        return;
    }

    await page.mouse.click(x, y);

    res.send("Clicked at " + x + ", " + y);
});

app.get("/sendText", async (req, res) => {
    let text = req.query.text;

    if (text === undefined || text === "") {
        res.send("Typed nothing");
        return;
    }

    if (
        text === "Up" ||
        text === "Down" ||
        text === "Left" ||
        text === "Right"
    ) {
        await page.keyboard.press("Arrow" + text);
    } else if (text === "Space") {
        await page.keyboard.press("Space");
    } else if (text === "Delete") {
        await page.keyboard.press("Backspace");
    } else if (text === "Forwards") {
        await page.goForward();
    } else if (text === "Backwards") {
        await page.goBack();
    } else if (text === "Refresh") {
        await page.reload();
    } else if (text === "Enter") {
        await page.keyboard.press("Enter");
    } else {
        await page.keyboard.type(text);
    }

    res.send("Typed: " + text);
});

app.get("/preview", async (req, res) => {
    const screenshotBuffer = await page.screenshot();
    res.writeHead(200, {
        "Content-Type": "image/png",
        "Content-Length": screenshotBuffer.length,
    });
    res.end(screenshotBuffer);
});

app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
});
