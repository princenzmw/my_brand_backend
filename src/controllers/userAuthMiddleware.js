import jwt from 'jsonwebtoken'; // For the user Authentication

import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';  // Generate unique identifiers 

export const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Please authenticate (Use your token).' });
    }
};

// Setting up the multer upload (Change "Media/profiles" to your upload directory)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'Media/profiles');
    },
    filename: function (req, file, cb) {
        cb(null, uuidv4() + path.extname(file.originalname));
    }
});

export default multer({ storage: storage });
