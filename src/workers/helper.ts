import "dotenv/config";
import { ConnectionOptions } from "bullmq";
import { Account, CrawlResult } from "../crawlers/helper";
import { PostDetailResult } from "../crawlers/post-comments-crawler";
import { PostIdsResult } from "../crawlers/post-ids-crawler";
import { AdsIdsResult } from "../crawlers/ads-ids-crawler";

export function getRedisConnection(): ConnectionOptions {
  const redisHost = process.env.REDIS_HOST;
  const redisPort = +process.env.REDIS_PORT;
  const redisPassword = process.env.REDIS_PASSWORD;

  return {
    port: redisPort,
    host: redisHost,
    password: redisPassword,
  };
}

export enum QueueName {
  POST_IDS = "post_ids",
  POST_DETAIL = "post_detail",
  ADS_IDS = "ads_ids",
}

export type PostIdJobData = {
  url: string;
  id?: number;
};

export type PostDetailJobData = {
  url: string;
  id?: number;
};

export type AdsIdJobData = {
  account: Account;
};

export type LikePageJobData = Account;

export type PostIdJobResult = CrawlResult<PostIdsResult>;

export type AdsIdJobResult = CrawlResult<AdsIdsResult>;

export type PostDetailJobResult = CrawlResult<PostDetailResult>;
