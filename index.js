const http = require('http');
const puppeteer = require("puppeteer");
const { URL } = require('url');

/**
 * 
 * @param {{url: string, width: number, height: number}} params 
 * @returns {Promise<Buffer>}
 */
async function render(params) {
    const { url, width, height } = params;
    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = (await browser.pages())[0];
    await page.setViewport({ width, height });
    await page.goto(url);
    const image = await page.screenshot({ type: "jpeg" });
    await browser.close();
    return image;
}

/**
 * 
 * @param {http.IncomingMessage} req 
 * @param {http.ServerResponse} res 
 */
async function handler(req, res) {
    try {
        if (!req.url.startsWith("/render?")) {
            res.statusCode = 400;
            res.end(`path ${req.url} not found`);
            return;
        }
        const urlSearchParams = new URL(req.url, "http://example.com");
        const url = urlSearchParams.searchParams.get("url");
        if (!url) {
            res.statusCode = 400;
            res.end("missing url");
            return;
        }
        const width = +urlSearchParams.searchParams.get("width") || 300;
        const height = +urlSearchParams.searchParams.get("height") || 400;
        const params = { url, width, height };
        console.log(`render ${JSON.stringify(params)}`);
        const image = await render(params);
        res.end(image);
    } catch (e) {
        console.log(e);
        res.statusCode = 500;
        res.end("internal server error");
    }
}

/** @type {http.Server} */
const server = http.createServer(handler);
const port = +process.env.PORT || 3000;
server.listen(port, (err) => {
    if (err) {
        console.log(err);
    } else {
        console.log(`listening on ${port}`);
    }
});
