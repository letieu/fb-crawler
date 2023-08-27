import * as mysql from 'mysql2/promise';

interface JobConfig {
  url: string;
  interval: number;
}

class Database {
  private dbConnection: mysql.Connection;

  constructor(private dbConfig: mysql.ConnectionOptions) { }

  async init() {
    this.dbConnection = await mysql.createConnection(this.dbConfig);
    await this.dbConnection.connect();
  }

  async savePost(post: any) {
    // TODO: Implement this
    console.log(post, 'post');
  }

  async loadJobConfigs(): Promise<JobConfig[]> {
    const [rows] = await this.dbConnection.execute('SELECT url, interval FROM job_configs');
    return rows as JobConfig[];
  }

  async close() {
    await this.dbConnection.end();
  }
}

export default Database;
