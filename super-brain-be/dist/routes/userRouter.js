import express from "express";
import User from "../models/user.js";
import { z } from "zod";
import * as bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { JWT_Password } from "../config.js";
import { userMiddleware } from "../middlewares/auth.js";
import Content from "../models/content.js";
import crypto from "crypto";
import Links from "../models/links.js";
import { random } from "../utils.js";
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
        if (existingUser) {
            const comparePassword = await bcrypt.compare(password, existingUser.password);
            if (!comparePassword)
                return res.json({ message: "Password doesnot match" });
            const token = jwt.sign({
                id: existingUser._id
            }, JWT_Password);
            res.json(token);
        }
        else {
            res.status(403).json({ message: "User NOT FOUND With the Given Credentials" });
        }
    }
    catch (error) {
        console.error("Error occured during User Fetching ", error);
    }
});
router.post("/content", userMiddleware, async (req, res) => {
    try {
        const { link, type, title } = contentSchema.parse(req.body);
        const response = await Content.create({
            link,
            type,
            title,
            userId: req.userId
        });
        if (!response) {
            return res.status(411).json({ message: "`" });
        }
        return res.status(200).json({ message: "Content Added ", contentId: response._id });
    }
    catch (error) {
        console.error("Error Occured During adding content", error);
        res.status(411).json({ message: "Content Not Found" });
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
    const contentId = req.body;
    try {
        const response = await Content.deleteMany({
            contentId,
            userId: req.userId
        });
        if (!response)
            return;
        res.json({ message: "Content Deleted" });
    }
    catch (error) {
        console.log("Error in the Content Deletion", error);
        res.status(411).json({ message: "error in delete content" });
    }
});
router.post("/share/brain", userMiddleware, async (req, res) => {
    const { share } = req.body;
    const hash = random(10);
    if (share) {
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
        userId: link.userId
    });
    return res.json({
        username: user?.username,
        content
    });
});
export default router;
//# sourceMappingURL=userRouter.js.map