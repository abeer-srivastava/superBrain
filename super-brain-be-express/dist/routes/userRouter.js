import express from "express";
import User from "../models/user.js";
import { z } from "zod";
import * as bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { JWT_Password } from "../config.js";
import { userMiddleware } from "../middlewares/auth.js";
import Content from "../models/content.js";
import Links from "../models/links.js";
import { random } from "../utils.js";
import { generateEmbedding } from "../utils/createEmbedding.js";
import { index } from "../utils/pineConeClient.js";
const router = express.Router();
const userSignUpSchema = z.object({
    username: z.string().min(6),
    email: z.string(),
    password: z.string().min(8)
});
const userSigninSchema = z.object({
    email: z.string(),
    password: z.string().min(8)
});
const contentSchema = z.object({
    link: z.string(),
    type: z.string(),
    title: z.string()
});
router.post("/signup", async (req, res) => {
    const data = userSignUpSchema.parse(req.body);
    if (!data)
        return res.status(411).json({ message: "Validation Failed" });
    try {
        const { email, username, password } = data;
        if (!username || !password) {
            return res.status(411).json({ message: "username and password are required" });
        }
        // db call
        const existingUser = await User.findOne({ email });
        if (existingUser)
            return res.status(411).json({ message: "User already exists" });
        // hashing the password for the db call 
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const dbResponse = await User.create({
            username,
            password: hashedPassword,
            email
        });
        return res.status(200).json({ message: `User Created`, userId: dbResponse._id });
    }
    catch (error) {
        console.log("error during signup", error);
        return res.json({ message: "Error occured during the signup" });
    }
});
router.post("/signin", async (req, res) => {
    try {
        console.log("📝 Signin request received:", { email: req.body.email });
        const data = userSigninSchema.parse(req.body);
        if (!data)
            return res.status(411).json({ message: "Validation failed for signin" });
        const { email, password } = data;
        if (!email || !password)
            return res.json("Valid Field are Required ");
        // db call
        const existingUser = await User.findOne({
            email
        });
        console.log("👤 User found:", existingUser ? "Yes" : "No");
        if (existingUser) {
            const comparePassword = await bcrypt.compare(password, existingUser.password);
            console.log("🔐 Password match:", comparePassword);
            if (!comparePassword) {
                console.log("❌ Password mismatch");
                return res.status(401).json({ message: "Password doesnot match" });
            }
            const token = jwt.sign({
                id: existingUser._id
            }, JWT_Password);
            console.log(" Token generated:", token.substring(0, 20) + "...");
            console.log(" Sending token response");
            return res.json(token);
        }
        else {
            console.log(" User not found");
            return res.status(403).json({ message: "User NOT FOUND With the Given Credentials" });
        }
    }
    catch (error) {
        console.error(" Error occured during User Fetching ", error);
        return res.status(500).json({ message: "Internal server error" });
    }
});
router.post("/content", userMiddleware, async (req, res) => {
    try {
        const { link, type, title } = contentSchema.parse(req.body);
        const content = await Content.create({
            link,
            type,
            title,
            userId: req.userId
        });
        if (!content) {
            return res.status(411).json({ message: "Failed to create content" });
        }
        // Generate embedding from title + link + type
        try {
            const textEmbedding = `${title} ${link} ${type}`;
            const embeddings = await generateEmbedding(textEmbedding);
            // Save embedding to MongoDB
            content.embedding = embeddings;
            await content.save();
            // Upsert to Pinecone
            if (!req.userId)
                return res.json({ message: "User ID missing" });
            await index.upsert([
                {
                    id: content._id.toString(),
                    values: embeddings,
                    metadata: {
                        userId: req.userId,
                        title,
                        link,
                        type
                    }
                }
            ]);
            console.log(`Content created with embedding (ID: ${content._id})`);
        }
        catch (embeddingError) {
            console.error(" Failed to generate/save embedding:", embeddingError);
            // Continue even if embedding fails - content is still created
        }
        return res.status(201).json({
            message: "Content Added",
            content: {
                id: content._id,
                title,
                link,
                type
            }
        });
    }
    catch (error) {
        console.error("Error Occured During adding content", error);
        res.status(411).json({ message: "Content Not Found" });
    }
});
// Semantic search route
router.post("/search", userMiddleware, async (req, res) => {
    try {
        const { query } = req.body;
        if (!query || typeof query !== "string" || query.trim().length === 0) {
            return res.status(400).json({
                error: "Query is required and must be a non-empty string"
            });
        }
        // Generate embedding for the search query
        const queryEmbedding = await generateEmbedding(query);
        // Perform vector search in Pinecone
        const results = await index.query({
            vector: queryEmbedding,
            topK: 5,
            includeMetadata: true,
            filter: { userId: { $eq: req.userId } }
        });
        // Check if we have any matches
        if (!results.matches || results.matches.length === 0) {
            return res.json({
                message: "No matching content found",
                results: []
            });
        }
        // Extract IDs from matches
        const ids = results.matches.map(m => m.id);
        // Fetch full content from MongoDB
        const contentData = await Content.find({ _id: { $in: ids } });
        // Create a map for quick lookup
        const contentMap = new Map(contentData.map(c => [c._id.toString(), c]));
        // Combine results with scores, maintaining order from vector search
        const finalResults = results.matches.map(match => {
            const content = contentMap.get(match.id);
            return {
                id: match.id,
                score: match.score,
                title: content?.title || match.metadata?.title,
                link: content?.link || match.metadata?.link,
                type: content?.type || match.metadata?.type,
                metadata: match.metadata
            };
        }).filter(r => r.title); // Filter out any null results
        console.log(`Search completed: "${query}" - Found ${finalResults.length} results`);
        res.json({
            query,
            results: finalResults,
            count: finalResults.length
        });
    }
    catch (error) {
        console.error(" Search failed:", error);
        res.status(500).json({
            error: "Search failed",
            message: error instanceof Error ? error.message : "Unknown error"
        });
    }
});
router.get("/content", userMiddleware, async (req, res) => {
    try {
        const contentData = await Content.find({ userId: req.userId }).populate("userId", "username");
        return res.json({ contentData });
    }
    catch (error) {
        console.log("Error Occured During Fetching the Content", error);
        res.status(411).json({ message: "Content Not Found" });
    }
});
router.delete("/content", userMiddleware, async (req, res) => {
    const { contentId } = req.body;
    if (!contentId) {
        return res.status(400).json({ message: "Missing contentId" });
    }
    const response = await Content.deleteOne({
        _id: contentId,
        userId: req.userId
    });
    return res.json({ message: "Content Deleted" });
});
router.post("/share/brain", userMiddleware, async (req, res) => {
    const { share } = req.body;
    if (share) {
        const existingUser = await Links.findOne({
            userId: req.userId
        });
        if (existingUser) {
            return res.json({
                hash: existingUser.hash
            });
        }
        const hash = random(10);
        await Links.create({
            userId: req.userId,
            hash: hash
        });
        return res.status(201).json({ message: "Link created" + hash });
    }
    else {
        await Links.deleteOne({
            userId: req.userId
        });
        return res.status(201).json({ message: "Link Removed" });
    }
});
router.get("/share/brain/content", async (req, res) => {
    const { contentId } = req.body;
    const sharableContent = await Content.findOne({
        _id: contentId,
        userId: req.userId
    });
    if (!sharableContent) {
        return res.status(404).json({ error: "Content Not Found" });
    }
    const shareLink = random(10).toString();
    // TODO : to be implemented
});
router.get("/brain/:shareLink", async (req, res) => {
    const hash = req.params.shareLink;
    const link = await Links.findOne({
        hash
    });
    if (!link) {
        return res.status(411).json({ message: "Sorry Incorrect Inputs" });
    }
    const content = await Content.find({
        userId: link.userId
    });
    const user = await User.findOne({
        _id: link.userId
    });
    return res.json({
        username: user?.username,
        content
    });
});
export default router;
//# sourceMappingURL=userRouter.js.map