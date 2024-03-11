import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import route from './routes/userRoute.js';
import blgroute from './routes/blogRoute.js';

const app = express();
app.use(cors());

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

app.use("/api/user", route)
app.use("/api/blog", blgroute)
app.use('/api/Media', express.static('Media'));

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

export default app;
