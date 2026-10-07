import mongoose, { model, Schema } from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const UserSchema = new Schema({
    username: { type: String, unique: true },
    password: { type: String },
});

export const UserModel = model("User", UserSchema);
export const User = UserModel; // alias for User

const ContentSchema = new Schema({
    title: String,
    link: String,
    tags: [{ type: mongoose.Types.ObjectId, ref: 'Tag' }],
    type: String,
    userId: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
});

export const ContentModel = model("Content", ContentSchema);

const LinkSchema = new Schema({
    hash: String,
    userId: { type: mongoose.Types.ObjectId, ref: 'User', required: true, unique: true },
});

export const LinkModel = model("Links", LinkSchema);

export const connectDB = async () => {
    const mongoUrl = process.env.MONGO_URI || process.env.MONGO_URL;
    if (!mongoUrl) {
        throw new Error("MONGO_URI (or MONGO_URL) is missing from the backend .env file.");
    }
    try {
        await mongoose.connect(mongoUrl);
        console.log("Connected to MongoDB!");
    } catch (err) {
        console.error("Error connecting to MongoDB:", err);
        throw err;
    }
};
