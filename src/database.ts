import * as mysql from 'mysql2/promise';

type Comment = {
  commentId: string;
  name: string;
  phone: string;
  uid: string;
  comment: string;
}

type Post = {
  content: string;
  userId: string;
  comments: Comment[];
}

class Database {
  private dbConnection: mysql.Connection;

  constructor(private dbConfig: mysql.ConnectionOptions) { }

  async init() {
    this.dbConnection = await mysql.createConnection(this.dbConfig);
    await this.dbConnection.connect();

    console.log('Database initialized');
  }

  async savePost(postId: number, post: Post) {
    const query = 'UPDATE posts SET title = ? WHERE id = ?';
    const values = [post.content, postId];
    console.log('Saving post:', values);
    await this.dbConnection.query(query, values);

    await this.saveComments(postId, post.comments);
  }

  async saveComments(postId: number, comments: Comment[]) {
    if (comments.length === 0) {
      console.log('No comments to insert.');
      return;
    }

    const values = [];
    const placeholders = [];

    for (const comment of comments) {
      placeholders.push('(?, ?, ?, ?, ?)');
      values.push(comment.commentId, comment.name, comment.uid, comment.comment, postId);
    }

    const placeholdersString = placeholders.join(', ');

    const query = `REPLACE INTO comments (fb_id, name, uid, comment, post_id) VALUES ${placeholdersString}`;

    try {
      const [rows, fields] = await this.dbConnection.query(query, values);
      console.log(`Inserted ${comments.length} comments`);
    } catch (error) {
      console.error('Error inserting comments:', error);
    }
  }

  async getPosts() {
    // get all post status = 1
    const query = 'SELECT * FROM posts WHERE status = 1';
    const [rows, fields] = await this.dbConnection.query(query);
    return rows;
  }

  async getPost(postId: string) {
    const query = 'SELECT * FROM posts WHERE id = ?';
    const [rows, fields] = await this.dbConnection.query(query, [postId]);
    return rows[0];
  }

  async close() {
    await this.dbConnection.end();
  }
}

export default Database;
