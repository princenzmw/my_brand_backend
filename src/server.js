import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import userRoutes from './routes/userRoute.js';
import blogRoute from './routes/blogRoute.js';
import projectRoute from './routes/projectRoute.js';
import skillRoute from './routes/skillRoute.js';
import commentRoute from './routes/commentRoute.js';
import messageRoute from './routes/messageRoute.js';
import { v2 as cloudinary } from 'cloudinary';

dotenv.config(); // Load environment variables from .env file at the start

const app = express();
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Rate limiter configuration for login attempts
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Too many login attempts from this IP, please try again after 15 minutes'
});

// Apply rate limiter to login route only
app.use('/api/user/login', loginLimiter);

// Routes
app.use("/api/user", userRoutes);
app.use("/api/blog", blogRoute);
app.use("/api/project", projectRoute);
app.use("/api/skill", skillRoute);
app.use('/api/comments', commentRoute);
app.use('/api/messages', messageRoute);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('DB connection successful!');
        const PORT = process.env.PORT || 5000;

        // Cloudinary config
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_SECRET
        });

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch(error => {
        console.error('DB connection failed...', error);
    });

// Serve static files from the Media directory
app.use('/Media', express.static('Media'));

// Global error handling middleware
app.use((err, req, res, next) => {
    console.error('Global error handler:', err.message);
    res.status(err.status || 500).send({ error: 'An error occurred, please try again later.' });
});

export default app;
