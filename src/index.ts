import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { User, ContentModel, LinkModel, connectDB } from './db.js';
import { JWT_PASSWORD } from './config.js';
import { userMiddleware, UserMiddlware } from './middleware.js';
import { random } from './utilis.js';

const app = express();
const frontendOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim());

app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && frontendOrigins.includes(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Vary", "Origin");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
    }
    if (req.method === "OPTIONS") {
        res.sendStatus(204);
        return;
    }
    next();
});
app.use(express.json());

// Do not accept requests until the database is ready.
await connectDB();

app.post("/api/v1/signup", async (req, res) => {
    const username = typeof req.body?.username === "string" ? req.body.username.trim() : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";

    if (!/^[A-Za-z0-9._-]{3,30}$/.test(username)) {
        res.status(400).json({ message: "Username must be 3–30 characters and use only letters, numbers, dots, underscores, or hyphens." });
        return;
    }
    if (password.length < 8 || password.length > 72) {
        res.status(400).json({ message: "Password must be between 8 and 72 characters." });
        return;
    }

    try {
        const passwordHash = await bcrypt.hash(password, 12);
        await User.create({
            username: username,
            password: passwordHash
        });

        res.json({
            message: "User signed up"
        });
    } catch (error) {
        if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) {
            res.status(409).json({ message: "That username is already taken." });
            return;
        }
        console.error("Signup failed:", error);
        res.status(500).json({ message: "Unable to create account right now." });
    }
});

app.post("/api/v1/signin", async (req, res) => {
    const username = typeof req.body?.username === "string" ? req.body.username.trim() : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";

    if (!username || !password) {
        res.status(400).json({ message: "Enter your username and password." });
        return;
    }

    const existingUser = await User.findOne({ username });
    let passwordMatches = false;

    if (existingUser) {
        const storedPassword = existingUser.password;
        if (typeof storedPassword === "string" && /^\$2[aby]\$/.test(storedPassword)) {
            passwordMatches = await bcrypt.compare(password, storedPassword);
        } else if (storedPassword === password) {
            // Upgrade accounts created before password hashing was added.
            existingUser.password = await bcrypt.hash(password, 12);
            await existingUser.save();
            passwordMatches = true;
        }
    }

    if (existingUser && passwordMatches) {
        const token = jwt.sign({
            id: existingUser._id
        }, JWT_PASSWORD);

        res.json({
            token
        });
    } else {
        res.status(403).json({
            message: "Incorrect credentials"
        });
    }
});

app.post("/api/v1/content", UserMiddlware, async (req, res) => {
    const { link, type, title } = req.body;
    await ContentModel.create({
        title,
        link,
        type,
        userId: req.userId!,
        tags: []
    });

    res.json({
        message: "Content created"
    });
});

app.get("/api/v1/content", UserMiddlware, async (req, res) => {
    const userId = req.userId;
    const content = await ContentModel.find({
        userId: userId!
    }).populate("userId", "username");

    res.json({
        content
    });
});

app.delete("/api/v1/content", UserMiddlware, async (req, res) => {
    const contentId = req.body.contentId;

    await ContentModel.deleteMany({
        _id: contentId,
        userId: req.userId!
    });

    res.json({
        message: "Deleted"
    });
});

app.post("/api/v1/brain/share", userMiddleware, async (req, res) => {
    const share = req.body.share;
    if (share) {
        const existingLink = await LinkModel.findOne({
            userId: req.userId!
        });

        if (existingLink) {
            res.json({
                hash: existingLink.hash
            });
            return;
        }

        const hash = random(10);
        await LinkModel.create({
            userId: new mongoose.Types.ObjectId(req.userId!),
            hash: hash
        });

        res.json({
            hash
        });
    } else {
        await LinkModel.deleteOne({
            userId: req.userId!
        });

        res.json({
            message: "Removed link"
        });
    }
});

app.get("/api/v1/brain/:shareLink", async (req, res) => {
    const hash = req.params.shareLink;

    const link = await LinkModel.findOne({
        hash
    });

    if (!link) {
        res.status(411).json({
            message: "Sorry incorrect input"
        });
        return;
    }

    const content = await ContentModel.find({
        userId: link.userId!
    });

    const user = await User.findOne({
        _id: link.userId!
    });

    if (!user) {
        res.status(411).json({
            message: "user not found, error should ideally not happen"
        });
        return;
    }

    res.json({
        username: user.username,
        content: content
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
