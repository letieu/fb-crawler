import { ConnectionOptions } from "bullmq";
import { Account, CrawlResult } from "../crawlers/helper";
import { PostDetailResult } from "../crawlers/post-comments-crawler";
import { PostIdsResult } from "../crawlers/post-ids-crawler";

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

export enum QueueName {
  CRAWL = 'Crawl',
}

export enum JobType {
  POST_IDS = 'PostIds',
  POST_DETAIL = 'PostDetail',
}

export type CrawlJobData = {
  url: string; // group url, post url
  account: Account;
  type: JobType;
}

export type CrawlJobResult = CrawlResult<PostDetailResult | PostIdsResult>;
