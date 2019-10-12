# Puppeteer Page Crawler

The aim of this package is to crawl the pages of your application and perform a similar task on each one.

Some potential ideas:
- Taking screenshots of your application.
- Running accessibility tests on each page by using `axe-puppeteer`.
- Creating PDFs from your application.

## Installation

```
npm install puppeteer puppeteer-page-crawler
```

## Example usage

```javascript
const { run } = require('puppeteer-page-crawler');

const siteConfig = {
  id: 'deque-university',
  origin: 'https://dequeuniversity.com',
  baseUrl: 'https://dequeuniversity.com/demo/mars/',
  needsLogin: false,
  maxPageVisits: 10,
};

let imageId = 0;
async function takeScreenshot({ page }) {
  await page.screenshot({ path: `./image-${imageId}.png` });
  imageId++;
}

run(siteConfig, takeScreenshot);
```

A more comprehensive example of taking screenshots can be found in `/example`. It can be run locally using `npm run example`.

## TypeScript warning

When passing `siteConfig` as the first parameter to `run`, make sure that it extends `SiteConfig`, otherwise you're likely to get a type error.
