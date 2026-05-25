import { Hono } from "hono";
import { cors } from "hono/cors";
import userRouter from "./routes/userRouter";

// Environment Bindings injected by Cloudflare Workers
export type Bindings = {
  MONGO_URL: string;
  PINECONE_KEY: string;
  PINECONE_INDEX_NAME: string;
  Gemini_API_KEY: string;
  HF_API_KEY?: string;
  JWT_Password?: string;
};

// Variable context schema for Hono request state
export type Variables = {
  userId: string;
};

export type AppContext = {
  Bindings: Bindings;
  Variables: Variables;
};

const app = new Hono<AppContext>();

// CORS configuration (matching Express setup)
app.use(
  "/*",
  cors({
    origin: ["http://localhost:3001", "http://localhost:3000"],
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["POST", "GET", "OPTIONS", "DELETE"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true
  })
);

// Global error handler
app.onError((err, c) => {
  console.error("🔥 Global App Error:", err);
  c.status(500);
  return c.json({ error: "Internal Server Error", message: err.message });
});

// Mount the userRouter
app.route("/api/v1/user", userRouter);

// Health check endpoint
app.get("/", (c) => {
  return c.text("SecondBrain Hono Cloudflare Worker API is running!");
});

export default app;
