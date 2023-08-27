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

    await this.migrate();
    console.log('Database initialized');
  }

  private async migrate() {
    await this.dbConnection.execute(`
      CREATE TABLE IF NOT EXISTS job_configs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        url VARCHAR(255) NOT NULL,
        \`interval\` INT NOT NULL
      );
    `);

    console.log('Migration successful: Job configuration table created.');
  }

  async savePost(post: any) {
    // TODO: Implement this
    console.log(post, 'post');
  }

  async loadJobConfigs(): Promise<JobConfig[]> {
    const [rows] = await this.dbConnection.execute(`
      SELECT * FROM job_configs;
    `);

    console.log('Loaded job configs:', rows);
    return rows as JobConfig[];
  }

  async close() {
    await this.dbConnection.end();
  }
}

export default Database;
