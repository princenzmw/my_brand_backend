import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDirectory = path.join(__dirname, '..', 'Media', 'profiles');

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}

// Token authentication middleware
export const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided. Please authenticate.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found. Please authenticate.' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Error in auth middleware: ", error);
    res.status(401).json({ error: 'Please authenticate (Use a valid token).' });
  }
};

// Admin role checking middleware
export const admin = async (req, res, next) => {
  try {
    if (req.user.role === 'admin') {
      next();
    } else {
      res.status(403).json({ error: 'User is not an admin.' });
    }
  } catch (error) {
    console.error("Error in admin middleware: ", error);
    res.status(500).json({ error: 'Error checking admin status.' });
  }
};

// File type validation for image uploads
const imageFileFilter = (req, file, cb) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

// Multer configuration for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDirectory,
    filename: (req, file, cb) => {
      cb(null, uuidv4() + path.extname(file.originalname));
    },
  }),
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 1024 * 1024 * 5 // Limit file size to 5MB
  }
});

export default upload;
