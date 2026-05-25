import { Queue } from 'bullmq';
import dotenv from 'dotenv';

dotenv.config();

function getRedisConnection() {
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    const parsed = new URL(redisUrl);
    return {
      host: parsed.hostname,
      port: parsed.port ? Number(parsed.port) : 6379,
      username: parsed.username || undefined,
      password: parsed.password || undefined,
      tls: parsed.protocol === 'rediss:' || redisUrl.includes('upstash.io') ? {} : undefined,
    };
  }
  return {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number(process.env.REDIS_PORT || 6379),
    password: process.env.REDIS_PASSWORD || undefined,
  };
}

async function main() {
  const queue = new Queue('extraction', {
    connection: getRedisConnection(),
  });

  try {
    const counts = await queue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed', 'paused');
    console.log('--- Queue Job Counts ---');
    console.log(counts);

    const jobs = await queue.getJobs(['waiting', 'active', 'delayed', 'failed'], 0, 50, true);
    console.log(`\n--- Active/Waiting/Delayed/Failed Jobs (${jobs.length}) ---`);
    for (const job of jobs) {
      const state = await job.getState();
      console.log(`- Job ID: ${job.id}, Name: ${job.name}, State: ${state}, Attempts Made: ${job.attemptsMade}, Error: ${job.failedReason || 'none'}`);
    }
  } catch (e) {
    console.error(e);
  } finally {
    await queue.close();
  }
}

main().catch(console.error);
