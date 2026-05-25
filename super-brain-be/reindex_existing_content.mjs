import mongoose from 'mongoose';
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

  const host = (process.env.REDIS_HOST || '127.0.0.1').replace(/^https?:\/\//, '');
  const port = Number(process.env.REDIS_PORT || 6379);
  const password = process.env.REDIS_PASSWORD || undefined;

  return {
    host,
    port,
    password,
    tls: host.includes('upstash.io') ? {} : undefined,
  };
}

async function main() {
  const mongoUrl = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/superbrain';
  const queue = new Queue('extraction', {
    connection: getRedisConnection(),
  });

  await mongoose.connect(mongoUrl);

  try {
    const db = mongoose.connection.db;
    const contents = await db.collection('contents').find({}).toArray();

    console.log(`Found ${contents.length} content record(s) to re-index.`);

    for (const content of contents) {
      await db.collection('contents').updateOne(
        { _id: content._id },
        { $set: { status: 'processing' } },
      );

      await queue.add(
        'extract',
        {
          contentId: String(content._id),
          type: content.type,
          originalLink: content.originalLink,
          extractedText: content.extractedText,
          isLocalFile: content.type === 'pdf' || content.type === 'image'
            ? Boolean(content.originalLink && !/^https?:\/\//i.test(content.originalLink))
            : false,
        },
        {
          jobId: `reindex-v3-${String(content._id)}`,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
          removeOnComplete: 1000,
          removeOnFail: 1000,
        },
      );

      console.log(`Enqueued re-index job for content ${String(content._id)} (${content.type}).`);
    }

    console.log('Re-index enqueue complete.');
  } finally {
    await queue.close();
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
