import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import userRoutes from './routes/userRoute.js';
import blogRoute from './routes/blogRoute.js';
import skillRoute from './routes/skillRoute.js';
import commentRoute from './routes/commentRoute.js';
import messageRoute from './routes/messageRoute.js';
import { v2 as cloudinary } from 'cloudinary';

dotenv.config(); // Load environment variables from .env file at the start

// Cloudinary configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const app = express();

// Allowed origins for CORS
const allowedOrigins = [
    'https://princenzmw.netlify.app',
    'http://127.0.0.1:5500',
    'https://princenzmw.github.io',
    'https://princenzmw.github.io/my-brand-Prince/'
];

// CORS middleware configuration
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
}));

// Express body parser middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// MongoDB connection string
const MONGO_URL = process.env.MONGO_URL;

// Connect to MongoDB
mongoose.connect(MONGO_URL)
    .then(() => console.log('Database connected successfully to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

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
app.use("/api/skill", skillRoute);
app.use('/api/comments', commentRoute);
app.use('/api/messages', messageRoute);

// Serve static files from the Media directory
app.use('/Media', express.static('Media'));

// Global error handling middleware
app.use((err, req, res, next) => {
    console.error('Global error handler:', err.message);
    res.status(err.status || 500).send({ error: 'An error occurred, please try again later.' });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

export default app;
