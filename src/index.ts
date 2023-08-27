import 'dotenv/config';
import puppeteer, { Browser, Page } from 'puppeteer';
import config from './config';
import { parseComments } from './parsers/comment-parser';
import { parsePostContent } from './parsers/post-parser';

const fs = require('fs');

const POST_URL = 'https://mbasic.facebook.com/groups/817474248860972/posts/1373289956612729/'
const CHROME_PROFILE_ID = 1

class Crawler {
  browser: Browser;
  page: Page;

  async initPuppeter() {
    this.browser = await puppeteer.launch({
      headless: config.headless,
      args: ["--no-sandbox"],
      userDataDir: `./profile/${CHROME_PROFILE_ID}`,
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

      const loginResponse = await crawler.loginFacebook(process.env.EMAIL, process.env.PASS);
      if (!loginResponse.success) {
        throw new Error('Login failed');
      }

      await this.page.goto(POST_URL, { waitUntil: "networkidle2" });

      const postContent = await this.getPostContent();
      const comments = await this.getComments();

      // save comments to json file
      const data = JSON.stringify(comments);
      fs.writeFileSync('comments.json', data);

      // close
      await this.browser.close();
    } catch (error) {
      console.log(error);
    } finally {
      // await this.browser.close();
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

const crawler = new Crawler();
crawler.start();
