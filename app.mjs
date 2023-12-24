import Replicate from "replicate";
import fs from "fs";
import { JSDOM } from "jsdom";
import fetch from "node-fetch";
import chockidar from "chokidar";
import { error } from "console";

const replicate = new Replicate({
    auth: process.env.REPLICATE_AUTH,
});

let lastline = "";

const watcher = chockidar.watch('file.txt', {
    ignored: /(^|[\/\\])\../,
    persistent: true,
});

watcher.on('change', async (path) => {
    const line = fs.readFileSync(path, 'utf-8');
    console.log('getting file from:', line + '...');
    if (error) {
        console.log(error);
    }
    let lines = line.split('\n');
    let newLine = lines[lines.length - 1];
    if (newLine !== lastline) {
        lastline = newLine;
        const output = await replicate.run(
            "yorickvp/llava-13b:e272157381e2a3bf12df3a8edd1f38d1dbd736bbb7437277c8b34175f8fce358",
            {
                input: {
                    image: lastline,
                    top_p: 1,
                    prompt: "Can you create a good filename based on details for this image? Just give me the filename, no pre-amble, and no extension.",
                }
            }
        );
        const filename = output.toString().replace(/ /g, '').toLowerCase().replace(/\./g, '').replace(/,/g, '');
        downloadImage(newLine, `downloads/${filename}.png`);
    }

});

const downloadImage = async (url, path) => {
    const dom = new JSDOM();
    const { window } = dom;
    global.window = window;
    global.document = window.document;

    const response = await fetch(url);
    const buffer = await response.buffer();
    fs.writeFile(path, buffer, () =>
        console.log('finished downloading!'));

    delete global.window;
    delete global.document;
};