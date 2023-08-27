import * as mysql from 'mysql2/promise';

type Comment = {
  id: string;
  name: string;
  phone: string;
  uid: string;
  comment: string;
  postId: string;
}

type Post = {
  postContent: string;
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

  async savePost(post: Post) {
    await this.saveComments(post.comments);
  }

  async saveComments(comments) {
    if (comments.length === 0) {
      console.log('No comments to insert.');
      return;
    }

    const values = [];
    const placeholders = [];

    for (const comment of comments) {
      placeholders.push('(?, ?, ?, ?, ?)');
      values.push(comment.name, comment.phone, comment.uid, comment.comment, comment.postId);
    }

    const placeholdersString = placeholders.join(', ');

    const query = `INSERT INTO comments (name, phone, uid, comment, post_id) VALUES ${placeholdersString}`;

    try {
      const [rows, fields] = await this.dbConnection.query(query, values);
      console.log(`Inserted ${comments.length} comments`);
    } catch (error) {
      console.error('Error inserting comments:', error);
    }
  }

  async close() {
    await this.dbConnection.end();
  }
}

export default Database;
