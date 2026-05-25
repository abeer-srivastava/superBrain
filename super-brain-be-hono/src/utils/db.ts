import { MongoClient, Db, ObjectId } from "mongodb";

export interface UserDoc {
  _id?: ObjectId;
  username: string;
  email: string;
  password: string;
}

export interface ContentDoc {
  _id?: ObjectId;
  link: string;
  title: string;
  tags?: ObjectId[];
  userId: ObjectId;
  type: string;
  embedding?: number[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface LinkDoc {
  _id?: ObjectId;
  hash: string;
  userId: ObjectId;
}

export interface TagDoc {
  _id?: ObjectId;
  name: string;
  tagId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

let cachedClient: MongoClient | null = null;

export async function getDb(mongoUrl: string): Promise<Db> {
  if (cachedClient) {
    return cachedClient.db("superBrain");
  }

  if (!mongoUrl) {
    throw new Error("MONGO_URL environment variable is missing.");
  }

  // Create a MongoClient with Node.js compatibility socket options
  const client = new MongoClient(mongoUrl);
  await client.connect();
  cachedClient = client;

  return client.db("superBrain");
}

export async function getUsersCollection(mongoUrl: string) {
  const db = await getDb(mongoUrl);
  return db.collection<UserDoc>("users");
}

export async function getContentCollection(mongoUrl: string) {
  const db = await getDb(mongoUrl);
  return db.collection<ContentDoc>("contents");
}

export async function getLinksCollection(mongoUrl: string) {
  const db = await getDb(mongoUrl);
  return db.collection<LinkDoc>("links");
}

export async function getTagsCollection(mongoUrl: string) {
  const db = await getDb(mongoUrl);
  return db.collection<TagDoc>("tags");
}
