import 'dotenv/config';
import express from 'express';
import { ExpressAdapter } from '@bull-board/express';
import { PostCommentsQueue } from './queues/post-comments';
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import swaggerUi from 'swagger-ui-express';
import bodyParser from 'body-parser';
import fs from 'fs';
import YAML from 'yaml';
import { ConnectionOptions } from 'mysql2';
import Database from './database';

const file = fs.readFileSync('./swagger.yaml', 'utf8')
const swaggerDocument = YAML.parse(file)

const dbConfig: ConnectionOptions = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: Number(process.env.MYSQL_PORT),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
};

const queue = new PostCommentsQueue();
const db = new Database(dbConfig);
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/queues');

async function main() {
  await db.init();
  await queue.init(db);

  await queue.reloadQueue();

  const { addQueue, removeQueue, setQueues, replaceQueues } = createBullBoard({
    queues: [new BullAdapter(queue.queue)],
    serverAdapter: serverAdapter,
  });

  const app = express();
  app.use(bodyParser.json());
  app.use('/queues', serverAdapter.getRouter());

  // manage jobs
  app.post('/jobs', async (req, res) => {
    const { id, interval } = req.body;
    try {
      const post = await db.getPost(id);
      if (!post) {
        res.status(404).json({ error: 'Post not found' });
        return;
      }

      const url = post.link;

      queue.addCrawlJob(id, url, interval);
      res.status(200).json({ message: 'Job added successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'An error occurred while adding the job' });
    }
  });

  app.delete('/jobs/:id', (req, res) => {
    try {
      queue.removeCrawlJob(req.params.id); // Call the method to remove a job
      res.status(200).json({ message: 'Job removed successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'An error occurred while removing the job' });
    }
  });

  app.get('/jobs', async (req, res) => {
    try {
      const jobs = await queue.getCrawlJobs(); // Call the method to get all jobs
      res.status(200).json(jobs);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'An error occurred while getting the jobs' });
    }
  });

  app.get('/posts', async (req, res) => {
    try {
      const posts = await db.getPosts();
      res.status(200).json(posts);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'An error occurred while getting the posts' });
    }
  });

  app.post('/reload', async (req, res) => {
    try {
      await queue.reloadQueue();
      res.status(200).json("Ok");
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'An error occurred while getting the posts' });
    }
  });

  // doc
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  app.listen(+process.env.APP_PORT, () => {
    console.log('Running on 3000...');
    console.log('For the UI, open http://localhost:3000/docs');
  });
}

main().catch(console.error);
