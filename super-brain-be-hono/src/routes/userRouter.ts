import { Hono } from "hono";
import { z } from "zod";
import bcryptjs from "bcryptjs";
import { sign } from "hono/jwt";
import { ObjectId } from "mongodb";
import { AppContext } from "../index";
import { userMiddleware } from "../middlewares/auth";
import {
  getUsersCollection,
  getContentCollection,
  getLinksCollection
} from "../utils/db";
import { generateEmbedding } from "../utils/createEmbedding";
import { getPineconeIndex } from "../utils/pineConeClient";
import { random } from "../utils";

const userRouter = new Hono<AppContext>();

const userSignUpSchema = z.object({
  username: z.string().min(6),
  email: z.string().email(),
  password: z.string().min(8)
});

const userSigninSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const contentSchema = z.object({
  link: z.string().url(),
  type: z.enum(["tweet", "video", "article", "document", "link"]),
  title: z.string().min(1)
});

// Signup Route
userRouter.post("/signup", async (c) => {
  try {
    const body = await c.req.json();
    const parsed = userSignUpSchema.safeParse(body);
    
    if (!parsed.success) {
      c.status(400);
      return c.json({ message: "Validation Failed", errors: parsed.error.format() });
    }

    const { email, username, password } = parsed.data;
    const usersColl = await getUsersCollection(c.env.MONGO_URL);

    // Check if user exists
    const existingUser = await usersColl.findOne({ email });
    if (existingUser) {
      c.status(409);
      return c.json({ message: "User already exists" });
    }

    // Password hashing
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);

    const result = await usersColl.insertOne({
      username,
      email,
      password: hashedPassword
    });

    c.status(201);
    return c.json({ message: "User Created", userId: result.insertedId.toString() });
  } catch (error) {
    console.error("error during signup", error);
    c.status(500);
    return c.json({ message: "Error occurred during signup", error: error instanceof Error ? error.message : String(error) });
  }
});

// Signin Route
userRouter.post("/signin", async (c) => {
  try {
    const body = await c.req.json();
    const parsed = userSigninSchema.safeParse(body);

    if (!parsed.success) {
      c.status(400);
      return c.json({ message: "Validation failed for signin", errors: parsed.error.format() });
    }

    const { email, password } = parsed.data;
    const usersColl = await getUsersCollection(c.env.MONGO_URL);

    const existingUser = await usersColl.findOne({ email });
    if (!existingUser) {
      c.status(403);
      return c.json({ message: "User NOT FOUND With the Given Credentials" });
    }

    const comparePassword = await bcryptjs.compare(password, existingUser.password);
    if (!comparePassword) {
      c.status(401);
      return c.json({ message: "Password does not match" });
    }

    // Generate JWT token
    const jwtSecret = c.env.JWT_Password || "abeer@123";
    const token = await sign(
      {
        id: existingUser._id.toString(),
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 // 24 hours
      },
      jwtSecret
    );

    return c.json(token);
  } catch (error) {
    console.error("Error occurred during User Fetching", error);
    c.status(500);
    return c.json({ message: "Internal server error", error: error instanceof Error ? error.message : String(error) });
  }
});

// Create Content Route (Auth Required)
userRouter.post("/content", userMiddleware, async (c) => {
  try {
    const userId = c.get("userId");
    const body = await c.req.json();
    const parsed = contentSchema.safeParse(body);

    if (!parsed.success) {
      c.status(400);
      return c.json({ message: "Validation failed", errors: parsed.error.format() });
    }

    const { link, type, title } = parsed.data;
    const contentColl = await getContentCollection(c.env.MONGO_URL);

    // Create initial content document in MongoDB
    const newContent = {
      link,
      type,
      title,
      userId: new ObjectId(userId),
      embedding: [] as number[],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await contentColl.insertOne(newContent);
    const contentId = result.insertedId;

    // Generate and save embedding, upsert to Pinecone
    try {
      const textEmbedding = `${title} ${link} ${type}`;
      const embeddings = await generateEmbedding(
        textEmbedding,
        c.env.Gemini_API_KEY,
        c.env.HF_API_KEY
      );

      // Update in MongoDB
      await contentColl.updateOne(
        { _id: contentId },
        { $set: { embedding: embeddings } }
      );

      // Upsert to Pinecone index
      const pineconeIndex = getPineconeIndex(c.env.PINECONE_KEY, c.env.PINECONE_INDEX_NAME);
      await pineconeIndex.upsert([
        {
          id: contentId.toString(),
          values: embeddings,
          metadata: {
            userId,
            title,
            link,
            type
          }
        }
      ]);

      console.log(`Content created with embedding (ID: ${contentId})`);
    } catch (embeddingError) {
      console.error("Failed to generate/save embedding:", embeddingError);
      // We continue since the database content itself succeeded.
    }

    c.status(201);
    return c.json({
      message: "Content Added",
      content: {
        id: contentId.toString(),
        title,
        link,
        type
      }
    });
  } catch (error) {
    console.error("Error occurred during adding content", error);
    c.status(500);
    return c.json({ message: "Internal server error" });
  }
});

// Semantic Search Route (Auth Required)
userRouter.post("/search", userMiddleware, async (c) => {
  try {
    const userId = c.get("userId");
    const body = await c.req.json();
    const { query } = body;

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      c.status(400);
      return c.json({ error: "Query is required and must be a non-empty string" });
    }

    // Generate embedding for search query
    const queryEmbedding = await generateEmbedding(
      query,
      c.env.Gemini_API_KEY,
      c.env.HF_API_KEY
    );

    // Query Pinecone
    const pineconeIndex = getPineconeIndex(c.env.PINECONE_KEY, c.env.PINECONE_INDEX_NAME);
    const results = await pineconeIndex.query({
      vector: queryEmbedding,
      topK: 5,
      includeMetadata: true,
      filter: { userId: { $eq: userId } }
    });

    if (!results.matches || results.matches.length === 0) {
      return c.json({
        message: "No matching content found",
        results: []
      });
    }

    // Get matching content from MongoDB
    const ids = results.matches.map(m => new ObjectId(m.id));
    const contentColl = await getContentCollection(c.env.MONGO_URL);
    const contentData = await contentColl.find({ _id: { $in: ids } }).toArray();

    // Map content by ID for easy sorting
    const contentMap = new Map(contentData.map(item => [item._id?.toString(), item]));

    // Format & preserve vector database ordering
    const finalResults = results.matches.map(match => {
      const dbContent = contentMap.get(match.id);
      return {
        id: match.id,
        score: match.score,
        title: dbContent?.title || match.metadata?.title,
        link: dbContent?.link || match.metadata?.link,
        type: dbContent?.type || match.metadata?.type,
        metadata: match.metadata
      };
    }).filter(r => r.title);

    console.log(`Search completed: "${query}" - Found ${finalResults.length} results`);

    return c.json({
      query,
      results: finalResults,
      count: finalResults.length
    });
  } catch (error) {
    console.error("Search failed:", error);
    c.status(500);
    return c.json({
      error: "Search failed",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Fetch Content Route (Auth Required)
userRouter.get("/content", userMiddleware, async (c) => {
  try {
    const userId = c.get("userId");
    const contentColl = await getContentCollection(c.env.MONGO_URL);

    // Mongoose populated userId with username. We achieve the same here with aggregation:
    const contentData = await contentColl
      .aggregate([
        { $match: { userId: new ObjectId(userId) } },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user"
          }
        },
        { $unwind: "$user" },
        {
          $project: {
            _id: 1,
            link: 1,
            title: 1,
            tags: 1,
            type: 1,
            embedding: 1,
            createdAt: 1,
            updatedAt: 1,
            userId: {
              _id: "$user._id",
              username: "$user.username"
            }
          }
        }
      ])
      .toArray();

    return c.json({ contentData });
  } catch (error) {
    console.error("Error occurred during fetching content", error);
    c.status(500);
    return c.json({ message: "Internal server error" });
  }
});

// Delete Content Route (Auth Required)
userRouter.post("/delete/content", userMiddleware, async (c) => {
  try {
    const userId = c.get("userId");
    const body = await c.req.json();
    const { contentId } = body;

    if (!contentId) {
      c.status(400);
      return c.json({ message: "Missing contentId" });
    }

    const contentColl = await getContentCollection(c.env.MONGO_URL);
    await contentColl.deleteOne({
      _id: new ObjectId(contentId),
      userId: new ObjectId(userId)
    });

    return c.json({ message: "Content Deleted" });
  } catch (error) {
    console.error("Error deleting content", error);
    c.status(500);
    return c.json({ message: "Internal server error" });
  }
});

// Share Brain Toggle Route (Auth Required)
userRouter.post("/share/brain", userMiddleware, async (c) => {
  try {
    const userId = c.get("userId");
    const body = await c.req.json();
    const { share } = body;

    const linksColl = await getLinksCollection(c.env.MONGO_URL);

    if (share) {
      const existingLink = await linksColl.findOne({ userId: new ObjectId(userId) });
      if (existingLink) {
        return c.json({ hash: existingLink.hash });
      }

      const hash = random(10);
      await linksColl.insertOne({
        userId: new ObjectId(userId),
        hash: hash
      });

      c.status(201);
      return c.json({ message: "Link created", hash });
    } else {
      await linksColl.deleteOne({ userId: new ObjectId(userId) });
      return c.json({ message: "Link Removed" });
    }
  } catch (error) {
    console.error("Error toggling share brain", error);
    c.status(500);
    return c.json({ message: "Internal server error" });
  }
});

// Get Shared Brain Content Route
userRouter.get("/brain/:shareLink", async (c) => {
  try {
    const hash = c.req.param("shareLink");
    const linksColl = await getLinksCollection(c.env.MONGO_URL);

    const linkDoc = await linksColl.findOne({ hash });
    if (!linkDoc) {
      c.status(404);
      return c.json({ message: "Sorry, incorrect inputs or shared brain not found" });
    }

    const usersColl = await getUsersCollection(c.env.MONGO_URL);
    const user = await usersColl.findOne({ _id: linkDoc.userId });

    const contentColl = await getContentCollection(c.env.MONGO_URL);
    const content = await contentColl.find({ userId: linkDoc.userId }).toArray();

    return c.json({
      username: user?.username,
      content
    });
  } catch (error) {
    console.error("Error fetching shared brain content", error);
    c.status(500);
    return c.json({ message: "Internal server error" });
  }
});

// Debug Route for Environment Config Validation
userRouter.get("/debug", async (c) => {
  const url = c.env.MONGO_URL;
  if (!url) {
    return c.json({ status: "missing" });
  }
  try {
    const cleanUrl = url.replace("mongodb+srv://", "http://").replace("mongodb://", "http://");
    const parsed = new URL(cleanUrl);
    return c.json({
      status: "present",
      protocol: url.startsWith("mongodb+srv") ? "mongodb+srv" : "mongodb",
      host: parsed.host,
      pathname: parsed.pathname
    });
  } catch (e) {
    return c.json({
      status: "error",
      message: e instanceof Error ? e.message : String(e),
      preview: url.substring(0, Math.min(15, url.length)) + "..."
    });
  }
});

export default userRouter;
