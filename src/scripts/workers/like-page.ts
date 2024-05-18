import "dotenv/config";
import { startLikePageWorker } from "../../workers/like-page-worker";

async function main() {
  await new Promise((resolve) => setTimeout(resolve, 20 * 1000)); // sleep 20s
  await startLikePageWorker();
}

main();
