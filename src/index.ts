import path from 'path';
import { launch, Page } from 'puppeteer';
import { URL } from 'url';

import logger from './logger';
import { SiteConfig, PageAction, AuthenticatedConfig } from './types';

export { SiteConfig } from './types';

export async function run<TSiteConfig extends SiteConfig, TPageActionResult>(
  siteConfig: TSiteConfig,
  pageAction: PageAction<TSiteConfig, TPageActionResult>,
) {
  let browser = await launch({
    headless: !siteConfig.debug,
    defaultViewport: siteConfig.viewport && { width: 1024, height: 768 },
  });
  let page = await browser.newPage();
  await page.setBypassCSP(true);

  if (siteConfig.needsLogin) {
    login(siteConfig as AuthenticatedConfig, page);
  } else {
    page.goto(siteConfig.baseUrl);
  }

  try {
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    await page.waitFor(1000);
  } catch (error) {
    logger.error('Failed to access page');
    await page.close();
    await browser.close();

    return [];
  }

  let firstPathname = new URL(page.url()).pathname;
  let pathnamesToVisit = [firstPathname];
  let pathnamesSeen: { [key: string]: boolean } = {
    [firstPathname]: true,
  };

  let results = await visit(
    siteConfig,
    page,
    pathnamesToVisit,
    pathnamesSeen,
    [],
    siteConfig.maxPageVisits || 100,
    pageAction,
  );

  await page.close();
  await browser.close();

  return results;
}

async function visit<TSiteConfig extends SiteConfig, TPageActionResult>(
  siteConfig: TSiteConfig,
  page: Page,
  pathnamesToVisit: string[],
  pathnamesSeen: { [key: string]: boolean },
  results: TPageActionResult[],
  maxVisitsLeft: number,
  pageAction: PageAction<TSiteConfig, TPageActionResult>,
): Promise<TPageActionResult[]> {
  if (pathnamesToVisit.length === 0 || maxVisitsLeft === 0) {
    return results;
  }

  let currentPathname = pathnamesToVisit[0];
  let pathnamesToVisitTail = pathnamesToVisit.slice(1);
  let url = path.join(siteConfig.origin, currentPathname);

  if (siteConfig.debug) {
    logger.log(`Visit ${url}`);
  }

  if (url !== page.url()) {
    page.goto(url);

    try {
      await page.waitForNavigation({ waitUntil: 'networkidle0' });
      await page.waitFor(1000);
    } catch (error) {
      logger.error(`Failed to access ${url}`);
      return visit(
        siteConfig,
        page,
        pathnamesToVisitTail,
        pathnamesSeen,
        results,
        maxVisitsLeft - 1,
        pageAction,
      );
    }
  }

  if (!page.url().startsWith(siteConfig.baseUrl)) {
    logger.log(`Domain has changed, current url: ${page.url()}`);

    return visit(
      siteConfig,
      page,
      pathnamesToVisitTail,
      pathnamesSeen,
      results,
      maxVisitsLeft - 1,
      pageAction,
    );
  }

  let {
    remainingPathnamesToVisit,
    pathnamesSeen: updatedPathnamesSeen,
  } = await getPathnames(siteConfig, page, pathnamesToVisitTail, pathnamesSeen);

  let latestResults = await pageAction({ page, siteConfig: siteConfig });
  results.push(latestResults);

  return visit(
    siteConfig,
    page,
    remainingPathnamesToVisit,
    updatedPathnamesSeen,
    results,
    maxVisitsLeft - 1,
    pageAction,
  );
}

async function getPathnames<TSiteConfig extends SiteConfig>(
  siteConfig: TSiteConfig,
  page: Page,
  remainingPathnamesToVisit: string[],
  pathnamesSeen: { [key: string]: boolean },
) {
  let newRemainingPathnamesToVisit = [...remainingPathnamesToVisit];
  let newPathnamesSeen = { ...pathnamesSeen };

  let hrefs = await page.$$eval('a[href]', (links: any[]) =>
    links.map(({ href, pathname }: HTMLAnchorElement) => ({
      href,
      pathname,
    })),
  );

  hrefs.forEach(({ href, pathname }) => {
    if (!href.startsWith(siteConfig.baseUrl) || href.endsWith('.pdf')) {
      return;
    }

    let replacedDigitsPathname = pathname.replace(/\d/g, '{d}');
    if (
      newPathnamesSeen[pathname] ||
      newPathnamesSeen[replacedDigitsPathname]
    ) {
      return;
    }

    newPathnamesSeen[pathname] = true;
    newPathnamesSeen[replacedDigitsPathname] = true;
    newRemainingPathnamesToVisit.push(pathname);
  });

  return {
    pathnamesSeen: newPathnamesSeen,
    remainingPathnamesToVisit: newRemainingPathnamesToVisit,
  };
}

async function login(siteConfig: AuthenticatedConfig, page: Page) {
  let {
    loginUrl,
    usernameSelector,
    username,
    passwordSelector,
    password,
    loginSelector,
  } = siteConfig;

  page.goto(loginUrl);
  await page.waitFor(usernameSelector);
  await page.type(usernameSelector, username);
  await page.waitFor(passwordSelector);
  await page.type(passwordSelector, password);

  page.click(loginSelector);
}
