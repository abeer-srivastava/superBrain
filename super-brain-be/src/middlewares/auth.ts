import type { Request,Response,NextFunction } from "express";
import type {Jwt, JwtPayload} from "jsonwebtoken";
import { JWT_Password } from "../config.js";
import jwt from "jsonwebtoken"

declare global{
    namespace Express{
        interface Request{
            userId?:string;
        }
    }
}

export const userMiddleware=(req:Request,res:Response,next:NextFunction)=>{
    try{
    const authHeader=req.headers["authorization"];
    console.log("the auth header",authHeader);

const decoded = jwt.verify(authHeader as string, JWT_Password) as JwtPayload;
    console.log("decoded token ",decoded);
    if(decoded){
        req.userId=decoded.id;
        next();
    }
    else{
        return res.status(411).json({message:"you are not logged in"});
    }
    } catch (error) {
        console.log("Error Occured During Token Decoding",error);
        return res.status(411).json({message:"Error in Token Validation"});
    }
    
}