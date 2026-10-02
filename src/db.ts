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

export const connectDB = async () => {
    const mongoUrl = process.env.MONGO_URI;
    if (!mongoUrl) {
        console.error("MONGO_URI is missing in .env file");
        return;
    }
    try {
        await mongoose.connect(mongoUrl);
        console.log("Connected to MongoDB!");
    } catch (err) {
        console.error("Error connecting to MongoDB:", err);
    }
};
