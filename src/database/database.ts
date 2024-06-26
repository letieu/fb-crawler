import * as mysql from "mysql2/promise";
import { Account, getAdsIdFromUrl, getPostIdFromUrl } from "../crawlers/helper";
import { OkPacket, RowDataPacket } from "mysql2/promise";
import { getDbConfig } from "./helper";
import { AdsIdsResult } from "../crawlers/ads-ids-crawler";
import { createCrawlPostIdsJobs } from "../queues/post-id-queue";

type Comment = {
  commentId: string;
  name: string;
  phone?: string;
  uid: string;
  comment: string;
  time: string;
};

type Post = {
  content: string;
  link: string;
  comments: Comment[];
};

type Ads = {
  content: string;
  link: string;
  time: string;
};

export enum AccountStatus {
  ACTIVE = 1,
  INACTIVE = 2,
  IN_USE = 3,
}

export enum GroupStatus {
  ACTIVE = 1,
  INACTIVE = 2,
}

export enum PostStatus {
  ACTIVE = 1,
  INACTIVE = 2,
}

class Database {
  private static instance: Database;

  private pool: mysql.Connection;

  private constructor(private dbConfig: mysql.ConnectionOptions) {
    this.pool = mysql.createPool({
      ...dbConfig,
      waitForConnections: true,
      connectionLimit: 10,
      maxIdle: 10, // max idle connections, the default value is the same as `connectionLimit`
      idleTimeout: 60000, // idle connections timeout, in milliseconds, the default value 60000
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    });
    console.log("Database initialized");
  }

  static getInstance() {
    if (!Database.instance) {
      Database.instance = new Database(getDbConfig());
    }

    return Database.instance;
  }

  async savePost(post: Post) {
    const query = "UPDATE posts SET title = ? WHERE fb_id = ?";
    const postFbId = getPostIdFromUrl(post.link);

    const values = [post.content, postFbId];

    await this.pool.query<mysql.OkPacket>(query, values);

    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT id FROM posts WHERE fb_id = ?`,
      [postFbId]
    );

    const postDatabaseId = rows[0].id;

    await this.saveComments(postDatabaseId, post.comments);
  }

  async saveAds(post: Ads) {
    const query = "UPDATE ads SET title = ?, time = ? WHERE fb_id = ?";
    const { postId: adsFbId } = getAdsIdFromUrl(post.link);

    const values = [post.content, post.time, adsFbId];

    await this.pool.query<mysql.OkPacket>(query, values);

    //const [rows] = await this.pool.query<RowDataPacket[]>(
    //  `SELECT id FROM ads WHERE fb_id = ?`,
    //  [adsFbId]
    //);

    //const postDatabaseId = rows[0].id;

    //await this.saveAdsComments(postDatabaseId, post.comments);
  }

  async savePostLinks(postLinks: string[], groupId: number) {
    if (postLinks.length === 0) {
      console.log("No post links to insert.");
      return;
    }

    const values = [];
    const placeholders = [];

    for (const link of postLinks) {
      placeholders.push("(?, ?, ?)");
      values.push(link, getPostIdFromUrl(link), groupId);
    }

    const placeholdersString = placeholders.join(", ");

    const query = `REPLACE INTO posts (link, fb_id, group_id) VALUES ${placeholdersString}`;

    try {
      const [rows, fields] = await this.pool.query<RowDataPacket[]>(
        query,
        values
      );
      console.log(`Inserted ${postLinks.length} post links`);
    } catch (error) {
      console.error("Error inserting post:", error);
    }
  }

  async saveAdsLinks(ads: string[]) {
    if (ads.length === 0) {
      console.log("No ads links to insert.");
      return;
    }

    const values = [];
    const placeholders = [];

    for (const link of ads) {
      const { pageId, postId } = getAdsIdFromUrl(link);
      if (!postId) continue;

      placeholders.push("(?, ?, ?)");
      values.push(link, postId, pageId ?? 0);
    }

    const placeholdersString = placeholders.join(", ");

    const query = `REPLACE INTO ads (link, fb_id, page_id) VALUES ${placeholdersString}`;

    try {
      const [rows, fields] = await this.pool.query<RowDataPacket[]>(
        query,
        values
      );
      console.log(`Inserted ${ads.length} ads links`);
    } catch (error) {
      console.error("Error inserting ads:", error);
    }
  }

  async saveComments(postId: number, comments: Comment[]) {
    if (comments.length === 0) {
      console.log("No comments to insert.");
      return;
    }

    const values = [];
    const placeholders = [];

    for (const comment of comments) {
      placeholders.push("(?, ?, ?, ?, ?, ?)");
      values.push(
        comment.commentId,
        comment.name,
        comment.uid,
        comment.comment,
        postId,
        comment.time
      );
    }

    const placeholdersString = placeholders.join(", ");

    const query = `INSERT IGNORE INTO comments (fb_id, name, uid, comment, post_id, time) VALUES ${placeholdersString}`;

    try {
      const [rows, fields] = await this.pool.query(query, values);
      console.log(`Inserted ${comments.length} comments`);
    } catch (error) {
      console.error("Error inserting comments:", error);
    }
  }

  async saveAdsComments(adsId: number, comments: Comment[]) {
    if (comments.length === 0) {
      console.log("No comments to insert.");
      return;
    }

    const values = [];
    const placeholders = [];

    for (const comment of comments) {
      placeholders.push("(?, ?, ?, ?, ?, ?)");
      values.push(
        comment.commentId,
        comment.name,
        comment.uid,
        comment.comment,
        adsId,
        comment.time
      );
    }

    const placeholdersString = placeholders.join(", ");

    const query = `INSERT IGNORE INTO ads_comments (fb_id, name, uid, comment, ads_id, time) VALUES ${placeholdersString}`;

    try {
      const [rows, fields] = await this.pool.query(query, values);
      console.log(`Inserted ${comments.length} comments`);
    } catch (error) {
      console.error("Error inserting comments:", error);
    }
  }

  async getPosts() {
    const query = `SELECT posts.*
      FROM posts
      INNER JOIN group_page ON posts.group_id = group_page.id
      WHERE posts.status = 1 AND group_page.status = 1 AND posts.created_at > NOW() - INTERVAL 1 DAY
      ORDER BY posts.title = '', posts.created_at DESC
      `;

    const [rows, fields] = await this.pool.query<RowDataPacket[]>(query);
    return rows;
  }

  async getAds() {
    const query = `SELECT ads.*
      FROM ads
      WHERE ads.status = 1 AND ads.created_at > NOW() - INTERVAL 2 DAY
      ORDER BY ads.created_at DESC
      `;

    const [rows, fields] = await this.pool.query<RowDataPacket[]>(query);
    return rows;
  }

  async getGroups() {
    const query = "SELECT * FROM group_page WHERE status = 1";
    const [rows, fields] = await this.pool.query<RowDataPacket[]>(query);
    return rows;
  }

  async getPages() {
    const query = "SELECT * FROM page WHERE status = 1";
    const [rows, fields] = await this.pool.query<RowDataPacket[]>(query);
    return rows;
  }

  async getPost(postId: string) {
    const query = "SELECT * FROM posts WHERE id = ?";
    const [rows, fields] = await this.pool.query(query, [postId]);
    return rows[0];
  }

  async getAccounts(): Promise<Account[]> {
    const query = "SELECT * FROM account WHERE status = 1";

    const [rows, fields] = await this.pool.query(query);

    return (rows as any).map((row: any) => {
      let liked: string[];
      try {
        liked = JSON.parse(row.liked ?? "[]");
      } catch (e) {
        liked = [];
      }

      return {
        username: row.username,
        password: row.password,
        secretCode: row.two_fa,
        liked: liked,
      };
    });
  }

  async updateAccountStatus(username: string, status: AccountStatus) {
    const query = "UPDATE account SET status = ? WHERE username = ?";

    const [rows, fields] = await this.pool.query(query, [status, username]);

    return rows;
  }

  async markOldPostAsInactive(days: number = 1) {
    const query = `
      UPDATE
        posts
      SET
        status = 2
      WHERE
        status = 1
        AND posts.id IN (
          SELECT
            posts.id AS post_id
          FROM
            posts
            LEFT JOIN comments ON posts.id = comments.post_id
          GROUP BY
            posts.id
          HAVING
            MAX(comments.created_at) <= NOW() - INTERVAL ${days} DAY
      )`;

    const [rows, fields] = await this.pool.query<OkPacket>(query);
    return rows;
  }

  async getNewAccount() {
    const db = Database.getInstance();

    const accounts = await db.getAccounts();
    if (accounts.length === 0) {
      throw new Error("No account found");
    }

    const selectedAccount = accounts[0];
    await db.updateAccountStatus(
      selectedAccount.username,
      AccountStatus.IN_USE
    );

    return selectedAccount;
  }

  async saveLiked(username: string, liked: string[]) {
    const searchQuery = "SELECT liked FROM account WHERE username = ?";
    const [rows, fields] = await this.pool.query(searchQuery, [username]);

    const account = rows[0];
    if (!account) {
      console.error(`Account not found ${username}`);
      return;
    }

    let currentLiked: string[];
    try {
      currentLiked = JSON.parse(account.liked ?? "[]");
    } catch (e) {
      currentLiked = [];
    }

    const newLiked = [...new Set([...currentLiked, ...liked])];

    const updateQuery = "UPDATE account SET liked = ? WHERE username = ?";
    await this.pool.query(updateQuery, [JSON.stringify(newLiked), username]);
  }
}

export default Database;
