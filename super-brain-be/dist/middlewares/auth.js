import { JWT_Password } from "../config.js";
import jwt from "jsonwebtoken";
export const userMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers["authorization"];
        console.log("the auth header", authHeader);
        const decoded = jwt.verify(authHeader, JWT_Password);
        console.log("decoded token ", decoded);
        if (decoded) {
            req.userId = decoded.id;
            next();
        }
        else {
            return res.status(411).json({ message: "you are not logged in" });
        }
    }
    catch (error) {
        console.log("Error Occured During Token Decoding", error);
        return res.status(411).json({ message: "Error in Token Validation" });
    }
};
//# sourceMappingURL=auth.js.map