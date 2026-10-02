import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { UserModel } from './db.js';

dotenv.config();

const app = express();

const mongoUrl = process.env.MONGO_URI; 

if (!mongoUrl) {
    console.error("MONGO_URI is missing in .env file");
    process.exit(1);
}

mongoose.connect(mongoUrl)
  .then(() => console.log('Connected to MongoDB!'))
  .catch((err) => console.error('Error connecting to MongoDB:', err));


app.post("/api/vi/sigup", (req, res) => {

});

app.post("/api/v1/sigin",(req,res) => {
    
});

app.post("/api/v1/content", (req,res) =>{

});

app.get("/api/v1/content/",(req,res) => {

});

app.delete("/api/v1/content", (req,res) => {

});

app.post("/api/v1/brain/share", (req,res) => {

});

app.get("/api/v1/shareLink", (req,res) => {

});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
