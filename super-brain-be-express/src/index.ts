import express, { urlencoded } from "express";
import userRouter from "./routes/userRouter.js";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

const app = express();
const PORT = 3000;
dotenv.config();

// Enable CORS for frontend
app.use(cors({
    origin: ["http://localhost:3001", "http://localhost:3000"],
    credentials: true
}));

const mongoConnect = async () => {
    try {
        console.log("URL", process.env.MONGO_URL);
        await mongoose.connect(process.env.MONGO_URL || "", {
            dbName: "superBrain"
        });
        console.log("DB Connect Successfully");
    } catch (err) {
        console.error("Connection Failed", err);
    }
}
mongoConnect();
app.use(urlencoded({ extended: true }));
app.use(express.json());

app.use("/api/v1/user", userRouter);
app.listen(PORT, () => {
    console.log("server started at " + PORT);
});