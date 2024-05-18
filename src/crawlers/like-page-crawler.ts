import { Browser, Page } from "puppeteer-core";
import {
  Account,
  delayRandomTime,
  initPuppeter,
  loginFacebook,
} from "./helper";
import "dotenv/config";

const chromeWsEndpoint = process.env.CHROME_WS_ENDPOINT_ID;

// crawl post ids from group, (not page)
export class LikePageCrawler {
  account: Account;

  constructor() {}

  setAccount(account: Account) {
    this.account = account;
    return this;
  }

  async start(pageUrls: string[]) {
    let liked = 0;

    let browser: Browser;

    try {
      browser = await initPuppeter(this.account, chromeWsEndpoint);

      const page = await browser.newPage();
      page.setViewport({ width: 1500, height: 764 });

      const loginSuccess = await loginFacebook(page, this.account);
      console.log("success", loginSuccess);

      if (loginSuccess) {
        for await (const url of pageUrls) {
          try {
            await this.likePage(page, url);
            liked++;
          } catch (e) {
            console.error(e);
          }
        }
      }
    } catch (error) {
      console.log("error when crawling post ids: ");
      console.error(error);
    } finally {
      if (browser) browser.close();
      await delayRandomTime(3000, 8000);
    }

    return { liked };
  }

  async likePage(page: Page, url: string) {
    await page.goto(url, { waitUntil: "networkidle2" });
    await page.waitForSelector('[aria-label="Like"]', {
      timeout: 10_000,
    });

    await Promise.all([
      page.$eval(`[aria-label="Like"]`, (element) => (element as any).click()),
      await delayRandomTime(3000, 5000)
    ]);

    console.log("after like");
  }
}
