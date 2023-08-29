import Queue from 'bull';

export function buildRedisConfig(): Queue.QueueOptions {
  const redisHost = process.env.REDIS_HOST;
  const redisPort = +process.env.REDIS_PORT;
  const redisPassword = process.env.REDIS_PASSWORD;

  if (!redisHost || !redisPort || !redisPassword) throw new Error('Redis host and port, password must be set');

  return { redis: { port: redisPort, host: redisHost, password: redisPassword } };
}
