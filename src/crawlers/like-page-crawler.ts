import { Browser, KnownDevices, Page } from "puppeteer-core";
import {
  Account,
  CrawlResult,
  delayRandomTime,
  initPuppeter,
  loginFacebook,
} from "./helper";
import "dotenv/config";
import { parse } from "dotenv";

const chromeWsEndpoint = process.env.CHROME_WS_ENDPOINT_PAGE_LIKE;

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
            // back to feed and scroll
            await page.goto("https://www.facebook.com", {
              waitUntil: "networkidle2",
            });
            // Scroll to load more feeds
            await delayRandomTime(1_000, 2_000);
            for await (const i of Array.from({ length: 10 }, (_, i) => i + 1)) {
              await delayRandomTime(200, 1_000);
              await page.evaluate((i) => {
                window.scrollTo(0, 700 * i);
              }, i);
            }

            await delayRandomTime(1000, 2000);

            const liked = await this.likePage(page, url);
            console.log(`like: ${url} ${liked}`);
            if (liked) res.data.liked.push(url);

            await delayRandomTime(1000, 2000);
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
    let liked = false;

    await page.goto(url, { waitUntil: "networkidle2" });

    await new Promise((res) => setTimeout(res, 10_000));

    // case have like btn
    liked = await page.evaluate(async () => {
      const likeBtnSelector = `div.m.bg-s3 > [aria-label="Like"] > div.m.bg-s5, div.m.bg-s3 > [aria-label="Thích"] > div.m.bg-s5`;
      const likeBtn: HTMLButtonElement =
        document.querySelector(likeBtnSelector);

      if (likeBtn) {
        likeBtn.click();
        await new Promise((res) => setTimeout(res, 2000));
        return true;
      }

      return false;
    });

    if (liked) return true;

    // case like btn inside option
    await page.evaluate(async () => {
      const optionSelector = `#screen-root > div > div:nth-child(2) > div:nth-child(5) > div:nth-child(2)`;
      const optionBtn: HTMLButtonElement =
        document.querySelector(optionSelector);

      if (optionBtn) {
        optionBtn.click();
        await new Promise((res) => setTimeout(res, 2000));

        const likeSelector = `#screen-root > div.m.bg-s1.dialog-screen > div.m.fixed-container.bottom > div > div > div > div:nth-child(2) > div`;
        const likeBtn: HTMLButtonElement = document.querySelector(likeSelector);
        if (likeBtn) likeBtn.click();
        await new Promise((res) => setTimeout(res, 3000));
      }
    });

    // check liked
    liked = await page.evaluate(() => {
      const likeBtnSelector = `div.m.bg-s3 > [aria-label="Liked"] > div.m.bg-s5, div.m.bg-s3 > [aria-label="Đã thích"] > div.m.bg-s5`;
      const likeBtn: HTMLButtonElement =
        document.querySelector(likeBtnSelector);

      return !!likeBtn;
    });

    return liked;
  }
}
