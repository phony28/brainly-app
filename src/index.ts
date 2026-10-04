import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { User, ContentModel, LinkModel, connectDB } from './db.js';
import { JWT_PASSWORD } from './config.js';
import { userMiddleware, UserMiddlware } from './middleware.js';
import { random } from './utilis.js';

const app = express();
app.use(express.json());

// Connect to MongoDB
connectDB();

app.post("/api/v1/signup", async (req, res) => {
    // put up zod and hashing passwords
    const username = req.body.username;
    const password = req.body.password;

    try {
        await User.create({
            username: username,
            password: password
        });

        res.json({
            message: "User signed up"
        });
    } catch (e) {
        res.status(411).json({
            message: "User already exists"
        });
    }
});

app.post("/api/v1/signin", async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    const existingUser = await User.findOne({
        username: username,
        password: password
    });

    if (existingUser) {
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
