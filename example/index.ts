import fs from 'fs';
import path from 'path';
import { Page } from 'puppeteer';

import { run } from '../src';
import siteConfig from './site-config';

async function takeScreenshot({ page }: { page: Page }) {
  return {
    url: page.url(),
    imageBuffer: await page.screenshot({}),
  };
}

async function example() {
  const outputFolder = path.join(__dirname, '../example-run');
  try {
    fs.mkdirSync(outputFolder);
  } catch (error) {
    // Do nothing (folder likely already exists)
  }

  const siteFolder = path.join(outputFolder, siteConfig.id);
  try {
    fs.mkdirSync(siteFolder);
  } catch (error) {
    // Do nothing (folder likely already exists)
  }

  const results = await run(siteConfig, takeScreenshot);

  results.forEach(({ url, imageBuffer }) => {
    const fileName = path.join(
      siteFolder,
      `${url
        .replace(/^https?:\/\//, '') // Remove protocol
        .replace(/\/$/, '') // Remove trailing slash
        .replace(/\.(x?html?|php|aspx?)$/, '') // Remove page suffix
        .replace('.', '-')
        .replace(/\//g, '-')}.png`,
    );
    fs.writeFileSync(fileName, imageBuffer);
  });
}

example();
