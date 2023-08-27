import 'dotenv/config';
import express from 'express';
import { ExpressAdapter } from '@bull-board/express';
import { CrawlerQueue } from './queue';
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

const queue = new CrawlerQueue();
const db = new Database(dbConfig);
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/queues');

async function main() {
  await db.init();
  await queue.init(db);

  const { addQueue, removeQueue, setQueues, replaceQueues } = createBullBoard({
    queues: [new BullAdapter(queue.crawlQueue)],
    serverAdapter: serverAdapter,
  });

  const app = express();
  app.use(bodyParser.json());
  app.use('/queues', serverAdapter.getRouter());

  // manage jobs
  app.post('/jobs', (req, res) => {
    const { url, interval } = req.body;
    try {
      queue.addCrawlJob(url, interval); // Call the method to add a new job
      res.status(200).json({ message: 'Job added successfully' });
    } catch (error) {
      res.status(500).json({ error: 'An error occurred while adding the job' });
    }
  });

  app.delete('/jobs/:id', (req, res) => {
    try {
      queue.removeCrawlJob(req.params.id); // Call the method to remove a job
      res.status(200).json({ message: 'Job removed successfully' });
    } catch (error) {
      res.status(500).json({ error: 'An error occurred while removing the job' });
    }
  });

  app.get('/jobs', async (req, res) => {
    try {
      const jobs = await queue.getCrawlJobs(); // Call the method to get all jobs
      res.status(200).json(jobs);
    } catch (error) {
      res.status(500).json({ error: 'An error occurred while getting the jobs' });
    }
  });

  app.patch('/jobs/:id', (req, res) => {
    const { interval } = req.body;
    try {
      queue.updateCrawlJob(req.params.id, interval); // Call the method to update a job
      res.status(200).json({ message: 'Job updated successfully' });
    } catch (error) {
      res.status(500).json({ error: 'An error occurred while updating the job' });
    }
  });

  // doc
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  app.listen(3000, () => {
    console.log('Running on 3000...');
    console.log('For the UI, open http://localhost:3000/docs');
  });
}

main().catch(console.error);
