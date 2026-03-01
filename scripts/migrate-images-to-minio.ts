import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  S3Client,
  PutObjectCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';

interface CardData {
  id: string;
  imageUrl: string | null;
  [key: string]: unknown;
}

const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT || 'http://localhost:9000';
const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY || 'narutomythos';
const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY || 'narutomythos-secret';
const MINIO_BUCKET = process.env.MINIO_BUCKET || 'narutomythos';

const s3 = new S3Client({
  endpoint: MINIO_ENDPOINT,
  region: 'us-east-1',
  credentials: {
    accessKeyId: MINIO_ACCESS_KEY,
    secretAccessKey: MINIO_SECRET_KEY,
  },
  forcePathStyle: true,
});

async function downloadImage(url: string): Promise<Buffer | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`  HTTP ${response.status} for ${url}`);
      return null;
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error(`  Download error: ${error}`);
    return null;
  }
}

async function uploadToMinio(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<boolean> {
  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: MINIO_BUCKET,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
    return true;
  } catch (error) {
    console.error(`  Upload error for ${key}: ${error}`);
    return false;
  }
}

async function main() {
  // Verify MinIO connection
  try {
    await s3.send(new HeadBucketCommand({ Bucket: MINIO_BUCKET }));
    console.log(`Connected to MinIO, bucket "${MINIO_BUCKET}" exists.\n`);
  } catch {
    console.error(
      `Cannot connect to MinIO or bucket "${MINIO_BUCKET}" does not exist.`,
    );
    console.error('Make sure docker compose is running: docker compose up -d');
    process.exit(1);
  }

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const cardsPath = join(__dirname, '..', 'prisma', 'data', 'cards.json');
  const cards: CardData[] = JSON.parse(readFileSync(cardsPath, 'utf-8'));

  let migrated = 0;
  let failed = 0;
  let skipped = 0;
  const failedCards: string[] = [];

  for (const card of cards) {
    if (!card.imageUrl || !card.imageUrl.startsWith('https://')) {
      skipped++;
      continue;
    }

    const key = `cards/${card.id}.webp`;
    process.stdout.write(`[${card.id}] Downloading... `);

    const imageData = await downloadImage(card.imageUrl);
    if (!imageData) {
      console.log('FAILED (download)');
      failed++;
      failedCards.push(card.id);
      card.imageUrl = null;
      continue;
    }

    process.stdout.write(`Uploading (${(imageData.length / 1024).toFixed(0)} KB)... `);
    const uploaded = await uploadToMinio(key, imageData, 'image/webp');
    if (!uploaded) {
      console.log('FAILED (upload)');
      failed++;
      failedCards.push(card.id);
      continue;
    }

    card.imageUrl = key;
    migrated++;
    console.log('OK');
  }

  // Write updated cards.json
  writeFileSync(cardsPath, JSON.stringify(cards, null, 2) + '\n', 'utf-8');
  console.log('\nUpdated prisma/data/cards.json');

  // Summary
  console.log('\n=== Migration Summary ===');
  console.log(`Migrated: ${migrated}`);
  console.log(`Failed:   ${failed}`);
  console.log(`Skipped:  ${skipped}`);
  if (failedCards.length > 0) {
    console.log(`Failed card IDs: ${failedCards.join(', ')}`);
  }
  console.log('\nNext step: run "pnpm db:seed" to update the database.');
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
