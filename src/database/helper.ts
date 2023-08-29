import 'dotenv/config';
import { ConnectionOptions } from "mysql2";

export function getDbConfig() {
  const dbConfig: ConnectionOptions = {
    host: process.env.MYSQL_HOST || 'localhost',
    port: Number(process.env.MYSQL_PORT),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  };

  return dbConfig;
}
