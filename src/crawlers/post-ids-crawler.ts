import { Browser, Page } from 'puppeteer-core';
import { Account, delayRandomTime, initPuppeter, loginFacebook, getPostLinkFromPostId, CrawlResult, getGroupIdFromUrl, convertToGroupLinkDesiredFormat } from './helper';
import { parsePostIds } from '../parsers/post-ids-parser';
import 'dotenv/config';

const chromeWsEndpoint = process.env.CHROME_WS_ENDPOINT_ID;

export type PostIdsResult = string[];


// crawl post ids from group, (not page)
export class PostIdsCrawler {
  url: string;
  account: Account;
  limit = 20;

  groupId: string;

  constructor(groupUrl: string) {
    this.url = groupUrl;

    this.groupId = getGroupIdFromUrl(this.url);
  }

  setLimit(limit: number) {
    this.limit = limit;
    return this;
  }

  setAccount(account: Account) {
    this.account = account;
    return this;
  }

  async start() {
    let res: CrawlResult<PostIdsResult>;
    let loginFailed = true;

    let browser: Browser;

    try {

      browser = await initPuppeter(
        this.account,
        chromeWsEndpoint,
      )

      const page = await browser.newPage();
      page.setViewport({ width: 1500, height: 764 });

      await loginFacebook(page, this.account);
      loginFailed = false;

      const url = convertToGroupLinkDesiredFormat(this.url);
      await page.goto(url, { waitUntil: "networkidle2" });

      const postIds = await this.getPostIds(page);
      res = {
        success: true,
        loginFailed: false,
        data: postIds,
      }

      if (page) await page.close();
    } catch (error) {
      console.log('error when crawling post ids: ');
      console.error(error);

      res = {
        success: false,
        loginFailed,
        data: [],
      }

      if (browser) await browser.close();
    } finally {
      console.log('Before close page');
      console.log('After close page');
      await delayRandomTime(1000, 3000);
    }

    return res;
  }

  async getPostIds(page: Page) {
    const allPostIds = [];

    while (true) {
      const postIds = await page.evaluate(parsePostIds);

      allPostIds.push(...postIds);
      console.log("postIds.length", postIds.length);

      if (allPostIds.length >= this.limit) {
        break;
      }

      const loadMoreLink = await this.getLoadMoreLink(page);

      if (loadMoreLink) {
        await delayRandomTime(1000, 6000);

        // scroll to bottom
        await page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight);
        });

        await page.goto(loadMoreLink, { waitUntil: "networkidle2" });
        await delayRandomTime(1000, 2000);
      }
      else {
        break;
      }
    }

    return allPostIds.map((id) => getPostLinkFromPostId(this.groupId, id));
  }

  async getLoadMoreLink(page: Page) {
    const loadMoreLink = await page.evaluate(() => {
      const loadMoreSelector1 = "#m_more_item > a";
      const loadMoreSelector2 = "#m_group_stories_container > div > a:has(span)";

      let link = document.querySelector(loadMoreSelector1) as HTMLAnchorElement;

      if (!link) {
        link = document.querySelector(loadMoreSelector2) as HTMLAnchorElement;
      }

      return link?.href;
    });

    return loadMoreLink;
  }
}
