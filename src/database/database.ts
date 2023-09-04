import * as mysql from 'mysql2/promise';
import { Account, getPostIdFromUrl } from '../crawlers/helper';
import { RowDataPacket } from 'mysql2/promise';

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
}

export enum GroupStatus {
  ACTIVE = 1,
  INACTIVE = 2,
}

class Database {
  private dbConnection: mysql.Connection;

  constructor(private dbConfig: mysql.ConnectionOptions) { }

  async init() {
    this.dbConnection = await mysql.createConnection(this.dbConfig);
    await this.dbConnection.connect();

    console.log('Database initialized');
  }

  async savePost(post: Post) {
    const query = 'REPLACE INTO posts (title, link, fb_id) VALUES (?, ?, ?)';
    const postFbId = getPostIdFromUrl(post.link);
    const values = [post.content, post.link, postFbId];

    const [res] = await this.dbConnection.query<mysql.OkPacket>(query, values);
    const postDatabaseId = res.insertId;

    console.log(`Updated post ${postDatabaseId}`);

    await this.saveComments(postDatabaseId, post.comments);
  }

  async savePostLinks(postLinks: string[]) {
    if (postLinks.length === 0) {
      console.log('No post links to insert.');
      return;
    }

    const values = [];
    const placeholders = [];

    for (const link of postLinks) {
      placeholders.push('(?, ?)');
      values.push(link, getPostIdFromUrl(link));
    }

    const placeholdersString = placeholders.join(', ');

    const query = `REPLACE INTO posts (link, fb_id) VALUES ${placeholdersString}`;

    try {
      const [rows, fields] = await this.dbConnection.query<RowDataPacket[]>(query, values);
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
      const [rows, fields] = await this.dbConnection.query(query, values);
      console.log(`Inserted ${comments.length} comments`);
    } catch (error) {
      console.error('Error inserting comments:', error);
    }
  }

  async getPosts() {
    // get all post status = 1
    const query = `SELECT * FROM posts WHERE status = 1 LIMIT ${postLimit}`;
    const [rows, fields] = await this.dbConnection.query<RowDataPacket[]>(query);
    return rows;
  }

  async getGroups() {
    const query = 'SELECT * FROM group_page WHERE status = 1';
    const [rows, fields] = await this.dbConnection.query<RowDataPacket[]>(query);
    return rows;
  }

  async getPost(postId: string) {
    const query = 'SELECT * FROM posts WHERE id = ?';
    const [rows, fields] = await this.dbConnection.query(query, [postId]);
    return rows[0];
  }

  async getAccounts(): Promise<Account[]> {
    const query = 'SELECT * FROM account WHERE status = 1';

    const [rows, fields] = await this.dbConnection.query(query);

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

    const [rows, fields] = await this.dbConnection.query(query, [status, username]);

    return rows;
  }

  async close() {
    await this.dbConnection.end();
    console.log('Database closed');
  }
}

export default Database;
