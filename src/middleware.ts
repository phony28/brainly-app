import type { NextFunction, Request, Response } from "express";
import { JWT_PASSWORD } from "./config.js";
import jwt, { type JwtPayload } from "jsonwebtoken";

// Extend Express Request type to include userId
declare global {
    namespace Express {
        interface Request {
            userId?: string;
        }
    }
}

export const userMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers["authorization"];
    if (!header) {
        res.status(401).json({
            message: "Unauthorized user"
        });
        return;
    }

    try {
        const decode = jwt.verify(header as string, JWT_PASSWORD) as JwtPayload;
        if (decode) {
            req.userId = (decode as any).id;
            next();
        } else {
            res.status(401).json({
                message: "Unauthorized user"
            });
        }
    } catch (e) {
        res.status(401).json({
            message: "Unauthorized user"
        });
    }
};

// Aliases for matching import naming
export const UserMiddlware = userMiddleware;
export const UserMiddleware = userMiddleware;