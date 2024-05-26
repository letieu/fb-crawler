import { Browser, KnownDevices, Page } from "puppeteer-core";
import {
  Account,
  CrawlResult,
  delayRandomTime,
  initPuppeter,
  loginFacebook,
} from "./helper";
import "dotenv/config";

const chromeWsEndpoint = process.env.CHROME_WS_ENDPOINT_ID;

export type LikePageResult = {
  liked: string[];
};

// crawl post ids from group, (not page)
export class LikePageCrawler {
  account: Account;

  constructor() {}

  setAccount(account: Account) {
    this.account = account;
    return this;
  }

  async start(pageUrls: string[]) {
    let res: CrawlResult<LikePageResult> = {
      success: false,
      loginFailed: false,
      data: {
        liked: [],
      },
    };

    let browser: Browser;

    try {
      browser = await initPuppeter(this.account, chromeWsEndpoint);

      const iPhone = KnownDevices["iPhone 13"];
      const page = await browser.newPage();
      await page.emulate(iPhone);

      const loginSuccess = await loginFacebook(page, this.account);
      console.log("success", loginSuccess);

      if (loginSuccess) {
        for await (const url of pageUrls) {
          try {
            await this.likePage(page, url);
            res.data.liked.push(url);

            // back to feed and scroll
            await page.goto("https://facebook.com", {
              waitUntil: "networkidle2",
            });
            await page.evaluate(() => {
              window.scrollTo(0, 700);
            });
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

    return res;
  }

  async likePage(page: Page, url: string) {
    await page.goto(url, { waitUntil: "networkidle2" });
    await page.waitForSelector('[aria-label="Like"], [aria-label="Thích"]', {
      timeout: 10_000,
    });

    await Promise.all([
      page.$eval(`[aria-label="Like"], [aria-label="Thích"]`, (element) =>
        (element as any).click()
      ),
      await delayRandomTime(3000, 5000),
    ]);
  }
}
