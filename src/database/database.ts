import * as mysql from 'mysql2/promise';
import { Account, getPostIdFromUrl } from '../crawlers/helper';
import { OkPacket, RowDataPacket } from 'mysql2/promise';
import { getDbConfig } from './helper';

const postLimit = 1000;

type Comment = {
  commentId: string;
  name: string;
  phone?: string;
  uid: string;
  comment: string;
  time: string;
}

type Post = {
  content: string;
  link: string;
  comments: Comment[];
}

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

  private constructor(private dbConfig: mysql.ConnectionOptions) { }

  private async init() {
    this.pool = mysql.createPool({
      ...this.dbConfig,
      waitForConnections: true,
      connectionLimit: 10,
      maxIdle: 10, // max idle connections, the default value is the same as `connectionLimit`
      idleTimeout: 60000, // idle connections timeout, in milliseconds, the default value 60000
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0
    });
    await this.pool.connect();

    console.log('Database initialized');
  }

  static async getInstance() {
    if (!Database.instance) {
      Database.instance = new Database(getDbConfig());
      await Database.instance.init();
    }

    return Database.instance;
  }

  async savePost(post: Post) {
    const query = 'REPLACE INTO posts (title, link, fb_id) VALUES (?, ?, ?)';
    const postFbId = getPostIdFromUrl(post.link);
    const values = [post.content, post.link, postFbId];

    const [res] = await this.pool.query<mysql.OkPacket>(query, values);
    const postDatabaseId = res.insertId;

    console.log(`Updated post ${postDatabaseId}`);

    await this.saveComments(postDatabaseId, post.comments);
  }

  async savePostLinks(postLinks: string[], groupId: number) {
    if (postLinks.length === 0) {
      console.log('No post links to insert.');
      return;
    }

    const values = [];
    const placeholders = [];

    for (const link of postLinks) {
      placeholders.push('(?, ?, ?)');
      values.push(link, getPostIdFromUrl(link), groupId);
    }

    const placeholdersString = placeholders.join(', ');

    const query = `REPLACE INTO posts (link, fb_id, group_id) VALUES ${placeholdersString}`;

    try {
      const [rows, fields] = await this.pool.query<RowDataPacket[]>(query, values);
      console.log(`Inserted ${postLinks.length} post links`);
    } catch (error) {
      console.error('Error inserting post:', error);
    }
  }

  async saveComments(postId: number, comments: Comment[]) {
    if (comments.length === 0) {
      console.log('No comments to insert.');
      return;
    }

    const values = [];
    const placeholders = [];

    for (const comment of comments) {
      placeholders.push('(?, ?, ?, ?, ?, ?)');
      values.push(comment.commentId, comment.name, comment.uid, comment.comment, postId, comment.time);
    }

    const placeholdersString = placeholders.join(', ');

    const query = `REPLACE INTO comments (fb_id, name, uid, comment, post_id, time) VALUES ${placeholdersString}`;

    try {
      const [rows, fields] = await this.pool.query(query, values);
      console.log(`Inserted ${comments.length} comments`);
    } catch (error) {
      console.error('Error inserting comments:', error);
    }
  }

  async getPosts() {
    const query = `SELECT posts.*
      FROM posts
      INNER JOIN group_page ON posts.group_id = group_page.id
      WHERE posts.status = 1 AND group_page.status = 1;`

    const [rows, fields] = await this.pool.query<RowDataPacket[]>(query);
    return rows;
  }

  async getGroups() {
    const query = 'SELECT * FROM group_page WHERE status = 1';
    const [rows, fields] = await this.pool.query<RowDataPacket[]>(query);
    return rows;
  }

  async getPost(postId: string) {
    const query = 'SELECT * FROM posts WHERE id = ?';
    const [rows, fields] = await this.pool.query(query, [postId]);
    return rows[0];
  }

  async getAccounts(): Promise<Account[]> {
    const query = 'SELECT * FROM account WHERE status = 1';

    const [rows, fields] = await this.pool.query(query);

    return (rows as any).map((row) => {
      return {
        username: row.username,
        password: row.password,
        secretCode: row.two_fa,
      };
    });
  }

  async updateAccountStatus(username: string, status: AccountStatus) {
    const query = 'UPDATE account SET status = ? WHERE username = ?';

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
}

export default Database;
