import { model, Schema } from "mongoose";

const UserSchema = new Schema({
    username: { type: String, unique: true },
    password: { type: String },

});

export const UserModel = model("User", UserSchema);
