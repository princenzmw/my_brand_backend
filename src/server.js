import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import userRoutes from './routes/userRoute.js';
import blgroute from './routes/blogRoute.js';
import sklroute from './routes/skillRoute.js';
import commentRoute from './routes/commentRoute.js';
import messageRoute from './routes/messageRoute.js';

const app = express();
app.use(cors({
    origin: 'https://princenzmwz.netlify.app',
}));

dotenv.config(); // Load environment variables from .env file

// ... app setup ...
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded
app.use(express.json()); // For parsing application/json

const PORT = process.env.PORT || 5000;
const MONGOURL = process.env.MONGO_URL;

mongoose.connect(MONGOURL).then(() => {
    console.log('Database Connected to MongoDB successfully');
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}).catch(err => console.log(err));

// Set up a rate limit for login attempts to prevent brute force attacks
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes window
    max: 10, // start blocking after 10 requests
    message: 'Too many login attempts from this IP, please try again after 15 minutes'
});

app.use('/api/user/login', loginLimiter); // Apply to login route

app.use("/api/user", userRoutes);
app.use("/api/blog", blgroute);
app.use("/api/skill", sklroute);
app.use('/api/comments', commentRoute);
app.use('/api/messages', messageRoute);
app.use('/api/Media', express.static('Media'));

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke! Please try again later.');
});

export default app;
