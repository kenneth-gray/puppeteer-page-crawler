import { SiteConfig } from '../src/types';

export type MySiteConfig = SiteConfig & {
  id: string;
};

const siteConfig: MySiteConfig = {
  id: 'deque-university',
  origin: 'https://dequeuniversity.com',
  baseUrl: 'https://dequeuniversity.com/demo/mars/',
  needsLogin: false,
  maxPageVisits: 10,
};

export default siteConfig;
