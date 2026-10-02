import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { User, ContentModel, connectDB } from './db.js';
import { JWT_PASSWORD } from './config.js';
import { UserMiddlware } from './middleware.js';

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

app.post("/api/v1/brain/share", (req, res) => {

});

app.get("/api/v1/shareLink", (req, res) => {

});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
