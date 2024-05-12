import { Browser, KnownDevices } from "puppeteer-core";
import {
  Account,
  delayRandomTime,
  initPuppeter,
  loginFacebook,
  CrawlResult,
} from "./helper";
import "dotenv/config";
import { getAdsLink } from "../parsers/ads-links-parser";

const chromeWsEndpoint = process.env.CHROME_WS_ENDPOINT_ID;

export type AdsIdsResult = string[];

// crawl post ids from group, (not page)
export class AdsIdsCrawler {
  account: Account;

  constructor() {}

  setAccount(account: Account) {
    this.account = account;
    return this;
  }

  async start() {
    let res: CrawlResult<AdsIdsResult> = {
      success: false,
      loginFailed: false,
      data: [],
    };

    let browser: Browser;

    try {
      browser = await initPuppeter(this.account, chromeWsEndpoint);

      const iPhone = KnownDevices["iPhone 13"];
      const page = await browser.newPage();
      await page.emulate(iPhone);

      const loginSuccess = await loginFacebook(page, this.account);

      if (loginSuccess) {
        await page.goto("https://facebook.com", { waitUntil: "networkidle2" });

        // Scroll to load more feeds
        await delayRandomTime(1_000, 2_000);
        for await (const i of Array.from({ length: 40 }, (_, i) => i + 1)) {
          await delayRandomTime(200, 1_000);
          await page.evaluate((i) => {
            window.scrollTo(0, 700 * i);
          }, i);

          console.log("Scroll ", i);
        }

        const links = await page.evaluate(getAdsLink);

        res.data = links;
        res.success = true;
      } else {
        res.loginFailed = true;
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
}
