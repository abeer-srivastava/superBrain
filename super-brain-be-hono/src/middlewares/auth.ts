import { MiddlewareHandler } from "hono";
import { verify } from "hono/jwt";
import { AppContext } from "../index";

export const userMiddleware: MiddlewareHandler<AppContext> = async (c, next) => {
  try {
    const authHeader = c.req.header("Authorization");
    console.log("📝 Auth header received:", authHeader ? "Present" : "Missing");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      c.status(401);
      return c.json({ message: "No token provided" });
    }

    // Extract token from "Bearer TOKEN" format
    const token = authHeader.substring(7);

    // Get the JWT secret from environment variables
    const jwtSecret = c.env.JWT_Password || "abeer@123";

    // Verify token using Web Crypto API
    const decoded = await verify(token, jwtSecret);
    console.log("👤 Decoded token payload:", decoded);

    if (decoded && decoded.id) {
      c.set("userId", decoded.id as string);
      await next();
    } else {
      c.status(411);
      return c.json({ message: "you are not logged in" });
    }
  } catch (error) {
    console.error("❌ Error occurred during token validation:", error);
    c.status(411);
    return c.json({ message: "Error in Token Validation" });
  }
};
