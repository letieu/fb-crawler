import { Page } from 'puppeteer';
import { Account, getGroupLink, convertToPostLinkDesiredFormat, delayRandomTime, initPuppeter, loginFacebook, getPostLinkFromPostId } from './helper';
import { parsePostIds } from '../parsers/post-ids-parser';

// crawl post ids from group, (not page)
export class PostIdsCrawler {
  groupId: string;
  account: Account;
  limit = 20;

  constructor(id: string, account: Account) {
    this.groupId = id;
    this.account = account;
  }

  setLimit(limit: number) {
    this.limit = limit;
  }

  async start() {
    const { browser, page } = await initPuppeter(
      this.account,
      process.env.BROWSER_POST,
      'post'
    );

    let res;

    try {
      await loginFacebook(page, this.account);

      const url = getGroupLink(this.groupId);

      await page.goto(url, { waitUntil: "networkidle2" });

      const postIds = await this.getPostIds(page);
      res = postIds;
    } catch (error) {
      console.error(error);
    } finally {
      await browser.close();
    }
    await delayRandomTime(1000, 1500);

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

        console.log("click load more wait for navigation");
        await page.goto(loadMoreLink, { waitUntil: "networkidle2" });
        console.log("after wait for navigation");
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
