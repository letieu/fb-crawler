import { ConnectionOptions } from "bullmq";

export function getRedisConnection(): ConnectionOptions {
  const redisHost = process.env.REDIS_HOST;
  const redisPort = +process.env.REDIS_PORT;
  const redisPassword = process.env.REDIS_PASSWORD;

  return {
    port: redisPort,
    host: redisHost,
    password: redisPassword
  }
}
