import puppeteer, { Browser, Page } from 'puppeteer';
import config from './config';
import { parseComments } from './parsers/comment-parser';
import { parsePostContent } from './parsers/post-parser';

export class PostCrawler {
  browser: Browser;
  page: Page;
  url: string;
  profileId: number;
  headless: boolean;

  constructor(url: string, profileId = 1, headless = true) {
    this.url = url;
    this.profileId = profileId;
    this.headless = headless;
  }

  async initPuppeter() {
    this.browser = await puppeteer.launch({
      headless: this.headless ? 'new' : false,
      args: ["--no-sandbox"],
      userDataDir: `./profile/${this.profileId}`,
      devtools: false,
    });
    const context = this.browser.defaultBrowserContext();
    context.overridePermissions(config.base_url, [
      "geolocation",
      "notifications",
    ]);
    this.page = await this.browser.newPage();
    this.page.setViewport({ width: 1500, height: 764 });
  }

  async loginFacebook(user_name, password) {
    await this.page.goto(config.base_url, { waitUntil: "networkidle2" });

    const isLogin = await this.page.evaluate(() => {
      const settingButton = document.querySelector('div[aria-label="Cài đặt và kiểm soát tài khoản"]')
      return !!settingButton
    });

    if (isLogin) {
      return {
        success: true,
        user: true,
        authenticated: true,
      };
    }

    await this.page.waitForSelector(config.username_field, {
      timeout: config.response_timeout,
    });
    await this.page.type(config.username_field, user_name, { delay: 50 });
    await this.page.type(config.password_field, password, { delay: 50 });
    await this.page.click(config.login_button);
    await this.page.waitForNavigation({ waitUntil: "networkidle2" });
    await this.page.waitForTimeout(1000 + Math.floor(Math.random() * 500));
    let bodyHTML = await this.page.evaluate(() => document.body.innerHTML);
    let bodyString = bodyHTML.toString();
    let loginResponse: any = {};

    if (bodyString.includes(config.username_invalid_msg)) {
      loginResponse.authenticated = false;
      loginResponse.user = false;
    } else if (bodyString.includes(config.password_invalid_msg)) {
      loginResponse.authenticated = false;
      loginResponse.user = true;
    } else if (
      bodyString.includes(config.credentials_invalid_msg_01) ||
      bodyString.includes(config.credentials_invalid_msg_02)
    ) {
      loginResponse.authenticated = false;
      loginResponse.user = false;
    } else {
      loginResponse.success = true;
      loginResponse.user = true;
      loginResponse.authenticated = true;
    }
    await this.page.waitForTimeout(500 + Math.floor(Math.random() * 500));
    return loginResponse;
  }

  async start() {
    try {
      await this.initPuppeter();

      const loginResponse = await this.loginFacebook(process.env.FB_EMAIL, process.env.FB_PASS);
      if (!loginResponse.success) {
        throw new Error('Login failed');
      }

      await this.page.goto(this.url, { waitUntil: "networkidle2" });

      const postContent = await this.getPostContent();
      const comments = await this.getComments();

      return {
        postContent,
        comments
      }
    } catch (error) {
      console.error(error);
    } finally {
      await this.browser.close();
    }
  }

  async getComments() {
    const allComments = [];

    while (true) {
      const comments = await this.page.evaluate(parseComments);

      allComments.push(...comments);

      const loadMoreSelector = "[id^=see_next_] > a";
      const loadMoreLink = await this.page.$(loadMoreSelector);

      if (loadMoreLink) {
        await loadMoreLink.click();
        await this.page.waitForNavigation({ waitUntil: "networkidle2" });
        new Promise((resolve) => setTimeout(resolve, Math.floor(Math.random() * 500)));
      }
      else {
        break;
      }
    }

    return allComments;
  }

  async getPostContent() {
    return this.page.evaluate(parsePostContent)
  }
}
