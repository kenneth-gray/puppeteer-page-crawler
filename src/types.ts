import { Page } from 'puppeteer';

type SharedConfigProps = {
  origin: string;
  baseUrl: string;
  maxPageVisits?: number;
  debug?: boolean;
  viewport?: {
    width: number;
    height: number;
  };
};

export type AuthenticatedConfig = SharedConfigProps & {
  usernameSelector: string;
  username: string;
  passwordSelector: string;
  password: string;
  loginSelector: string;
  loginUrl: string;
  needsLogin: true;
};

export type UnauthenticatedConfig = SharedConfigProps & {
  needsLogin: false;
};

export type SiteConfig = AuthenticatedConfig | UnauthenticatedConfig;

export type PageAction<TSiteConfig, TPageActionResult> = ({
  siteConfig,
  page,
}: {
  siteConfig: TSiteConfig;
  page: Page;
}) => Promise<TPageActionResult>;
