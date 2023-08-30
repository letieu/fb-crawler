import puppeteer, { Browser, Page } from "puppeteer";
import config from "./config";
import { authenticator } from "otplib";

export type Account = {
  username: string;
  password: string;
  secretCode: string;
}

export async function initPuppeter(account?: Account) {
  let browser: Browser;
  let page: Page;

  if (process.env.BROWSER_ENDPOINT) {
    console.log('Use browser endpoint', getBrowserEndpoint(account.username));

    browser = await puppeteer.connect({
      browserWSEndpoint: getBrowserEndpoint(account.username)
    });
  }
  else {
    browser = await puppeteer.launch({
      headless: false,
      args: ["--no-sandbox", "--disable-gpu"],
      userDataDir: `./profile/${account.username}`,
      devtools: false,
    });
  }

  if (!browser) {
    throw new Error('Cannot init browser');
  }

  const context = browser.defaultBrowserContext();
  context.overridePermissions(config.base_url, [
    "geolocation",
    "notifications",
  ]);
  page = await browser.newPage();
  page.setViewport({ width: 1500, height: 764 });

  return { browser, page };
}

export async function loginFacebook(page: Page, account: Account) {
  await page.goto(config.base_url, { waitUntil: "networkidle2" });

  const createPostButton = await page.$(config.create_post_button);
  if (createPostButton) {
    // already login
    return;
  }

  await page.waitForSelector(config.username_field, {
    timeout: config.response_timeout,
  });
  await page.type(config.username_field, account.username, { delay: 50 });
  await page.type(config.password_field, account.password, { delay: 50 });
  page.click(config.login_button);

  await page.waitForNavigation({ waitUntil: "networkidle2" });
  await delayRandomTime(1000, 1500);

  if (page.url().includes("login")) {
    console.log(`Login failed with account ${account.username}`);
    return;
  }

  if (page.url().includes("checkpoint")) {
    console.log('Need 2FA code');
    const code = get2fa(account.secretCode);
    console.log(`2FA code: ${code}`);
    await page.type(config.code_field, code, { delay: 50 });
    page.click(config.confirm_code_button);

    await page.waitForNavigation({ waitUntil: "networkidle2" });
    await delayRandomTime(1000, 1500);

    if (page.url().includes("login/checkpoint")) {
      page.click(config.confirm_code_button);

      await page.waitForNavigation({ waitUntil: "networkidle2" });
      await delayRandomTime(1000, 1500);
    }
  }
}

export async function ensureLogin(page: Page, account: Account) {
  if (page.url().includes("login")) {
    await loginFacebook(page, account);
  }

  if (page.url().includes("login")) {
    return false;
  }

  return true;
}

export function get2fa(secretCode: string) {
  const token = authenticator.generate(secretCode);
  return token;
}

export function convertToPostLinkDesiredFormat(url) {
  const matchesType1 = url.match(/(?:https?:\/\/)?(?:www\.)?facebook\.com\/groups\/([\w\-]+)\?.*multi_permalinks=([\w\-]+)/i);
  const matchesType2 = url.match(/(?:https?:\/\/)?(?:www\.)?facebook\.com\/groups\/([\w\-]+)\/posts\/([\w\-]+)/i);
  const matchesType3 = url.match(/(?:https?:\/\/)?(?:www\.)?facebook\.com\/groups\/([\w\-]+)\/?([\w\-]+)/i);

  let groupId, postId;

  if (matchesType1) {
    groupId = matchesType1[1];
    postId = matchesType1[2];
  } else if (matchesType2) {
    groupId = matchesType2[1];
    postId = matchesType2[2];
  } else if (matchesType3) {
    groupId = matchesType3[1];
    postId = matchesType3[2];
  } else {
    return url.replace('www', 'mbasic');
  }

  return `https://mbasic.facebook.com/groups/${groupId}/posts/${postId}/`;
}

export function getGroupLink(id: string) {
  return `https://mbasic.facebook.com/groups/${id}/`;
}

export function delayRandomTime(from = 500, to = 1000) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, from + Math.floor(Math.random() * (to - from)));
  });
}

export function getPostLinkFromPostId(groupId, postId) {
  return `https://www.facebook.com/groups/${groupId}/posts/${postId}/`;
}

export function getGroupIdFromUrl(groupUrl) {
  const matches = groupUrl.match(/(?:https?:\/\/)?(?:www\.)?facebook\.com\/groups\/([\w\-]+)/i);
  if (matches) {
    return matches[1];
  }
  return null;
}

export function getPostIdFromUrl(postUrl) {
  const matches = postUrl.match(/(?:https?:\/\/)?(?:www\.)?facebook\.com\/groups\/[\w\-]+\/posts\/([\w\-]+)/i);
  if (matches) {
    return matches[1];
  }
  return null;
}

export async function close(browser: Browser) {
  if (process.env.DEBUG === 'true') {
    // do not close browser
    return;
  }
  await delayRandomTime(1000, 6000);
  await browser.close();
}

function getBrowserEndpoint(profileName: string) {
  const endpoint = process.env.BROWSER_ENDPOINT;
  return `${endpoint}?--user-data-dir=${profileName}`;
}
